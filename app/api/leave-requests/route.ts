import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LeaveValidationService } from '@/lib/leave-validation-service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { DayPart, LeaveStatus } from '@/lib/generated/prisma/enums';
import { $Enums } from '@/lib/generated/prisma/client';
import { requireAuth, handleAuthError } from '@/lib/api-auth';

function toPrismaLeaveStatus(status: LeaveStatus): $Enums.LeaveStatus {
    return String(status).toUpperCase() as $Enums.LeaveStatus;
}

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
            policyId?: string | null;
        }> = [];
        let notificationApproverIds: string[] = [];
        let notificationWatcherIds: string[] = [];
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
            const workflowRoutingStartedAtMs = Date.now();
            const matchedPolicies = await WorkflowResolverService.findMatchingPolicies(
                user.id,
                projectId ?? null,
                'LEAVE_REQUEST',
                leaveTypeId
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

            const policyProjectIdMap = new Map(
                runtimeResolution.subFlows.map((subFlow) => [subFlow.policyId, subFlow.origin.projectId ?? null])
            );

            approvalStepsToCreate = runtimeOutcome.leaveStatus === LeaveStatus.NEW
                ? runtimeResolution.resolvers.map((resolver) => ({
                    approverId: resolver.userId,
                    roleId: null,
                    status: 0,
                    sequenceOrder: resolver.step ?? 1,
                    projectId: policyProjectIdMap.get(resolver.policyId || '') ?? projectId ?? null,
                    policyId: resolver.policyId
                }))
                : [];

            const minSequence = Math.min(...runtimeResolution.resolvers.map((r) => r.step ?? 1));

            notificationApproverIds = Array.from(
                new Set(
                    runtimeResolution.resolvers
                        .filter((r) => (r.step ?? 1) === minSequence)
                        .map((resolver) => resolver.userId)
                )
            );

            notificationWatcherIds = Array.from(
                new Set(runtimeResolution.watchers.map((watcher) => watcher.userId))
            ).filter((watcherId) =>
                watcherId !== user.id &&
                !notificationApproverIds.includes(watcherId)
            );

            const workflowRoutingElapsedMs = Date.now() - workflowRoutingStartedAtMs;
            console.info(`[WORKFLOW_PERF] leave-request routing completed in ${workflowRoutingElapsedMs}ms (policies=${matchedPolicyIds.length})`);
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
                    status: toPrismaLeaveStatus(status),
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
                        policyId: step.policyId ?? null,
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
                        LeaveStatus.NEW as any
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

        // 6. Send Notifications
        if (!isAutoApproved && status === LeaveStatus.NEW && notificationApproverIds.length > 0) {
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

                if (status === LeaveStatus.NEW && notificationWatcherIds.length > 0) {
                    notificationPromises.push(
                        ...notificationWatcherIds.map((watcherId) =>
                            NotificationService.notify(
                                watcherId,
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
                        )
                    );
                }

                await Promise.all(notificationPromises);
                console.log(`[LEAVE_NOTIFICATION] Successfully sent notifications for request ${leaveRequest.id}`);
            } catch (notificationError) {
                console.error('[LEAVE_NOTIFICATION] Failed to send notifications:', notificationError);
            }
        }

        // 6.b Watcher Notifications for Workflow-driven approval (if it resulted in immediate approval)
        if (!isAutoApproved && status === LeaveStatus.APPROVED) {
            try {
                await WatcherService.notifyWatchers(leaveRequest.id, 'LEAVE_APPROVED');
                console.log(`[LEAVE_NOTIFICATION] Notified watchers for auto-approved workflow request ${leaveRequest.id}`);
            } catch (watcherError) {
                console.error('[LEAVE_NOTIFICATION] Failed to notify watchers for workflow auto-approve:', watcherError);
            }
        }

        // 7. Send Approval Notification for Auto-Approved Requests
        if (isAutoApproved) {
            console.log(`[AUTO_APPROVAL] Sending approval notification to user ${user.id} for auto-approved request ${leaveRequest.id}`);
            try {
                // Requester notification
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

                // Watcher notification
                await WatcherService.notifyWatchers(leaveRequest.id, 'LEAVE_APPROVED', {
                    approverName: 'System',
                    projectId: projectId ?? undefined
                });

                console.log(`[AUTO_APPROVAL] Successfully sent notifications (requester + watchers) for request ${leaveRequest.id}`);
            } catch (notificationError) {
                console.error('[AUTO_APPROVAL] Failed to send notifications:', notificationError);
            }
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
