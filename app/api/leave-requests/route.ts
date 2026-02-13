import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LeaveValidationService } from '@/lib/leave-validation-service';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { DayPart, LeaveStatus } from '@/lib/generated/prisma/enums';
import { $Enums } from '@/lib/generated/prisma/client';
import { requireAuth, handleAuthError } from '@/lib/api-auth';

export async function POST(request: Request) {
    try {
        const user = await requireAuth();

        const body = await request.json();
        const {
            leaveTypeId,
            dateStart,
            dayPartStart,
            dateEnd,
            dayPartEnd,
            employeeComment,
            projectId // Optional, for advanced routing
        } = body;

        // 1. Validation
        const validation = await LeaveValidationService.validateRequest(
            user.id,
            leaveTypeId,
            new Date(dateStart),
            dayPartStart as DayPart,
            new Date(dateEnd),
            dayPartEnd as DayPart,
            employeeComment
        );

        if (!validation.isValid) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.errors
            }, { status: 400 });
        }

        // 2. Fetch Leave Type to check auto-approve
        const leaveType = await prisma.leaveType.findUnique({
            where: { id: leaveTypeId }
        });

        if (!leaveType) {
            return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
        }

        // 3. Determine Status and Approver
        let status: LeaveStatus = LeaveStatus.NEW;
        let approverId: string | null = null;
        let decidedAt: Date | null = null;
        let approvalStepsToCreate: Array<{
            approverId: string;
            roleId: string | null;
            status: number;
            sequenceOrder: number | null;
            projectId: string | null;
        }> = [];
        let notificationApproverIds: string[] = [];
        let shouldNotifyWatchersOnSubmit = false;
        let matchedPolicyIds: string[] = [];
        let runtimeResolution: Awaited<ReturnType<typeof WorkflowResolverService.generateSubFlows>> | null = null;
        let runtimeOutcome: ReturnType<typeof WorkflowResolverService.aggregateOutcome> | null = null;

        // Fetch user with contract/company for auto-approve and mode checks.
        const userWithContractType = await prisma.user.findUnique({
            where: { id: user.id },
            include: { contractType: true, company: true }
        });

        const isAutoApproved =
            user.isAutoApprove ||
            leaveType.autoApprove ||
            userWithContractType?.contractType?.name === 'Contractor';

        if (isAutoApproved) {
            status = LeaveStatus.APPROVED;
            approverId = user.id; // Self or System
            decidedAt = new Date();
        }

        // 4. Determine routing/runtime state (if not auto-approved)
        if (!isAutoApproved) {
            const companyMode = userWithContractType?.company?.mode ?? 1;

            if (companyMode === 1) {
                const routingResult = await ApprovalRoutingService.getApprovers(user.id, projectId);
                if (routingResult.mode === 'basic' && routingResult.approvers.length === 0) {
                    return NextResponse.json({ error: 'No valid approvers found for this request. Please contact your administrator.' }, { status: 400 });
                }

                approvalStepsToCreate = routingResult.approvalSteps.map((step) => ({
                    approverId: step.approverId,
                    roleId: step.roleId ?? null,
                    status: 0,
                    sequenceOrder: step.sequenceOrder ?? 1,
                    projectId: step.projectId ?? projectId ?? null
                }));
                notificationApproverIds = routingResult.approvers.map((approver) => approver.id);
                shouldNotifyWatchersOnSubmit = approvalStepsToCreate.length > 0;
            } else {
                const matchedPolicies = await WorkflowResolverService.findMatchingPolicies(
                    user.id,
                    projectId ?? null,
                    'LEAVE_REQUEST'
                );
                matchedPolicyIds = matchedPolicies.map((policy) => policy.id);

                runtimeResolution = await WorkflowResolverService.generateSubFlows(
                    matchedPolicies,
                    {
                        request: {
                            userId: user.id,
                            requestType: 'LEAVE_REQUEST',
                            projectId: projectId ?? undefined,
                            departmentId: user.departmentId ?? undefined,
                            areaId: user.areaId ?? undefined,
                        },
                        user: user as any,
                        company: {
                            id: user.companyId,
                            roles: [],
                            departments: [],
                            projects: [],
                            contractTypes: [],
                        }
                    }
                );

                runtimeOutcome = WorkflowResolverService.aggregateOutcome(runtimeResolution);
                status = runtimeOutcome.leaveStatus;
                decidedAt = runtimeOutcome.leaveStatus === LeaveStatus.NEW ? null : new Date();
                approverId = runtimeOutcome.leaveStatus === LeaveStatus.NEW ? null : user.id;

                approvalStepsToCreate = runtimeResolution.resolvers.map((resolver) => ({
                    approverId: resolver.userId,
                    roleId: null,
                    status: 0,
                    sequenceOrder: resolver.step ?? 1,
                    projectId: projectId ?? null
                }));

                notificationApproverIds = Array.from(
                    new Set(
                        runtimeResolution.resolvers.map((resolver) => resolver.userId)
                    )
                );
                shouldNotifyWatchersOnSubmit = status === LeaveStatus.NEW && runtimeResolution.watchers.length > 0;
            }
        }

        // 5. Create Request and Steps in Transaction
        const leaveRequest = await prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.create({
                data: {
                    userId: user.id,
                    leaveTypeId,
                    dateStart: new Date(dateStart),
                    dayPartStart: (dayPartStart as string).toUpperCase() as DayPart,
                    dateEnd: new Date(dateEnd),
                    dayPartEnd: (dayPartEnd as string).toUpperCase() as DayPart,
                    employeeComment,
                    status: (status as string).toUpperCase() as any,
                    approverId,
                    decidedAt,
                }
            });

            if (!isAutoApproved && approvalStepsToCreate.length > 0) {
                await tx.approvalStep.createMany({
                    data: approvalStepsToCreate.map(step => ({
                        approverId: step.approverId,
                        roleId: step.roleId,
                        status: step.status,
                        sequenceOrder: step.sequenceOrder,
                        projectId: step.projectId,
                        leaveId: request.id
                    }))
                });
            }

            const auditEvents = [];

            if (runtimeResolution && runtimeOutcome) {
                const auditBase = {
                    leaveId: request.id,
                    companyId: user.companyId,
                    byUserId: user.id
                };

                auditEvents.push(
                    WorkflowAuditService.policyMatchEvent(auditBase, {
                        requestType: 'LEAVE_REQUEST',
                        projectId: projectId ?? null,
                        matchedPolicyIds,
                        matchedPolicyCount: matchedPolicyIds.length
                    })
                );

                auditEvents.push(
                    ...WorkflowAuditService.fallbackEvents(auditBase, runtimeResolution)
                );

                auditEvents.push(
                    WorkflowAuditService.aggregatorOutcomeEvent(
                        auditBase,
                        runtimeOutcome,
                        LeaveStatus.NEW
                    )
                );
            }

            if (auditEvents.length > 0) {
                await tx.audit.createMany({
                    data: auditEvents
                });
            }

            return request;
        });

        // 6. Send Notifications Asynchronously
        if (!isAutoApproved && status === LeaveStatus.NEW && notificationApproverIds.length > 0) {
            // Send notifications asynchronously to avoid blocking response
            Promise.resolve().then(async () => {
                try {
                    console.log(`[LEAVE_NOTIFICATION] Processing notifications for request ${leaveRequest.id}`);

                    const approvers = await prisma.user.findMany({
                        where: {
                            id: { in: notificationApproverIds },
                            activated: true,
                            deletedAt: null
                        },
                        select: { id: true }
                    });

                    const notificationPromises = approvers.map((approver) =>
                        NotificationService.notify(
                            approver.id,
                            'LEAVE_SUBMITTED',
                            {
                                requesterName: `${user.name} ${user.lastname}`,
                                leaveType: leaveType.name,
                                startDate: dateStart,
                                endDate: dateEnd,
                                actionUrl: `/requests`
                            },
                            user.companyId
                        )
                    );

                    if (shouldNotifyWatchersOnSubmit) {
                        notificationPromises.push(
                            WatcherService.notifyWatchers(leaveRequest.id, 'LEAVE_SUBMITTED')
                        );
                    }

                    await Promise.all(notificationPromises);
                    console.log(`[LEAVE_NOTIFICATION] Successfully sent notifications for request ${leaveRequest.id}`);
                } catch (notificationError) {
                    console.error('[LEAVE_NOTIFICATION] Failed to send notifications:', notificationError);
                }
            }).catch(error => {
                console.error('[LEAVE_NOTIFICATION] Unhandled error in async notification:', error);
            });
        }

        // 7. Send Approval Notification for Auto-Approved Requests
        if (isAutoApproved) {
            console.log(`[AUTO_APPROVAL] Sending approval notification to user ${user.id} for auto-approved request ${leaveRequest.id}`);
            Promise.resolve().then(async () => {
                try {
                    await NotificationService.notify(
                        user.id,
                        'LEAVE_APPROVED',
                        {
                            requesterName: `${user.name} ${user.lastname}`,
                            approverName: 'System',
                            leaveType: leaveType.name,
                            startDate: dateStart,
                            endDate: dateEnd,
                            actionUrl: `/requests/${leaveRequest.id}`
                        },
                        user.companyId
                    );
                    console.log(`[AUTO_APPROVAL] Successfully sent notification for request ${leaveRequest.id}`);
                } catch (notificationError) {
                    console.error('[AUTO_APPROVAL] Failed to send notification:', notificationError);
                }
            }).catch(error => {
                console.error('[AUTO_APPROVAL] Unhandled error in async notification:', error);
            });
        }

        return NextResponse.json({
            message: status === LeaveStatus.APPROVED ? 'Leave request auto-approved.' : 'Leave request submitted successfully.',
            leaveRequest,
            daysRequested: validation.daysRequested
        }, { status: 201 });

    } catch (error) {
        return handleAuthError(error);
    }
}

export async function GET() {
    try {
        const user = await requireAuth();

        const requests = await prisma.leaveRequest.findMany({
            where: {
                userId: user.id,
                deletedAt: null
            },
            include: {
                leaveType: true,
                approver: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true
                    }
                },
                approvalSteps: {
                    include: {
                        approver: {
                            select: {
                                id: true,
                                name: true,
                                lastname: true
                            }
                        }
                    },
                    orderBy: {
                        sequenceOrder: 'asc'
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(requests);
    } catch (error) {
        return handleAuthError(error);
    }
}
