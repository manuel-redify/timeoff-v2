import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LeaveValidationService } from '@/lib/leave-validation-service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
import { NotificationOutboxService, type NotificationOutboxEvent } from '@/lib/services/notification-outbox.service';
import { DayPart, LeaveStatus } from '@/lib/generated/prisma/enums';
import { $Enums } from '@/lib/generated/prisma/client';
import type { User as PrismaUser } from '@/lib/generated/prisma/client';
import { requireAuth, handleAuthError } from '@/lib/api-auth';
import { LeaveCalculationService } from '@/lib/leave-calculation-service';

function toPrismaLeaveStatus(status: LeaveStatus): $Enums.LeaveStatus {
    return String(status).toUpperCase() as $Enums.LeaveStatus;
}

export async function POST(request: Request) {
    try {
        const sessionUser = await requireAuth();

        const body = await request.json();
        const {
            userId: bodyUserId,
            leaveTypeId,
            dateStart,
            dayPartStart,
            dateEnd,
            dayPartEnd,
            employeeComment,
            forceCreate,
            ignoreAllowance,
            status: bodyStatus,
            projectId // Optional, for advanced routing
        } = body;

        const shouldForceCreate = Boolean(forceCreate ?? ignoreAllowance);

        if (shouldForceCreate && !sessionUser.isAdmin) {
            return NextResponse.json({ error: 'Only admins can force-create requests beyond allowance.' }, { status: 403 });
        }

        let user = sessionUser;
        if (bodyUserId && bodyUserId !== sessionUser.id) {
            if (!sessionUser.isAdmin) {
                return NextResponse.json({ error: 'Unauthorized to create requests for other users' }, { status: 403 });
            }
            const targetUser = await prisma.user.findUnique({
                where: { id: bodyUserId, companyId: sessionUser.companyId },
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    companyId: true,
                    departmentId: true,
                    areaId: true,
                    isAdmin: true,
                    isAutoApprove: true,
                }
            });
            if (!targetUser) {
                return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
            }
            user = targetUser;
        }

        // 1. Validation
        const validation = await LeaveValidationService.validateRequest(
            user.id,
            leaveTypeId,
            new Date(dateStart),
            dayPartStart as DayPart,
            new Date(dateEnd),
            dayPartEnd as DayPart,
            employeeComment,
            shouldForceCreate && sessionUser.isAdmin
        );

        if (!validation.isValid) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.errors
            }, { status: 400 });
        }

        let leaveType = validation.resolvedLeaveType;
        if (!leaveType) {
            leaveType = await prisma.leaveType.findUnique({
                where: { id: leaveTypeId },
                select: {
                    id: true,
                    name: true,
                    autoApprove: true,
                    useAllowance: true,
                    limit: true
                }
            }) || undefined;
        }
        if (!leaveType) {
            return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
        }

        // 3. Determine Status and Approver
        const isAdminCreatingForOther = sessionUser.isAdmin && user.id !== sessionUser.id;
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

        // Fetch only contract type needed for contractor auto-approval check.
        const userWithContractType = await prisma.user.findUnique({
            where: { id: user.id },
            select: { contractType: { select: { name: true } } }
        });

        const isAutoApproved =
            user.isAutoApprove ||
            leaveType.autoApprove ||
            userWithContractType?.contractType?.name === 'Contractor';

        let adminForcedStatus = false;

        // Admin overrides bypass workflow only for terminal decisions or the default on-behalf approval.
        if (sessionUser.isAdmin && bodyStatus) {
            status = bodyStatus as LeaveStatus;
            if (status === LeaveStatus.APPROVED || status === LeaveStatus.REJECTED) {
                adminForcedStatus = true;
                approverId = sessionUser.id;
                decidedAt = new Date();
            }
        } else if (isAdminCreatingForOther) {
            status = LeaveStatus.APPROVED;
            adminForcedStatus = true;
            approverId = sessionUser.id;
            decidedAt = new Date();
        } else if (isAutoApproved) {
            status = LeaveStatus.APPROVED;
            approverId = user.id; // Self or System
            decidedAt = new Date();
        }

        // 4. Determine routing/runtime state (if not auto-approved and not Forced by admin)
        if (!isAutoApproved && !adminForcedStatus) {
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
                    user: user as unknown as PrismaUser,
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
        const durationMinutes = await LeaveCalculationService.calculateDurationMinutes(
            user.id,
            new Date(dateStart),
            dayPartStart as DayPart,
            new Date(dateEnd),
            dayPartEnd as DayPart
        );

        const leaveRequest = await prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.create({
                data: {
                    userId: user.id,
                    byUserId: sessionUser.id,
                    leaveTypeId,
                    dateStart: new Date(dateStart),
                    dayPartStart: (dayPartStart as string).toUpperCase() as DayPart,
                    dateEnd: new Date(dateEnd),
                    dayPartEnd: (dayPartEnd as string).toUpperCase() as DayPart,
                    durationMinutes,
                    employeeComment,
                    status: toPrismaLeaveStatus(status),
                    approverId,
                    decidedAt,
                }
            });

            if (!adminForcedStatus && !isAutoApproved && approvalStepsToCreate.length > 0) {
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
                byUserId: sessionUser.id,
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

            await tx.audit.create({
                data: {
                    entityType: 'leave_request',
                    entityId: request.id,
                    attribute: 'leave_request.creation',
                    oldValue: null,
                    newValue: JSON.stringify({
                        byUserId: sessionUser.id,
                        userId: user.id,
                        status,
                        leaveTypeId,
                        forceCreate: shouldForceCreate,
                    }),
                    companyId: user.companyId,
                    byUserId: sessionUser.id,
                }
            });

            if (shouldForceCreate && validation.allowanceExceeded) {
                await tx.audit.create({
                    data: {
                        entityType: 'leave_request',
                        entityId: request.id,
                        attribute: 'leave_request.force_create',
                        oldValue: null,
                        newValue: JSON.stringify({
                            actorId: sessionUser.id,
                            targetUserId: user.id,
                            daysRequested: validation.daysRequested ?? null,
                            exceededAllowance: true,
                        }),
                        companyId: user.companyId,
                        byUserId: sessionUser.id,
                    }
                });
            }

            return request;
        });

        // 6. Send Notifications
        const outboxEvents: NotificationOutboxEvent[] = [];

        if (!isAutoApproved && !adminForcedStatus && status === LeaveStatus.NEW && notificationApproverIds.length > 0) {
            const approvers = await prisma.user.findMany({
                where: {
                    id: { in: notificationApproverIds },
                    activated: true,
                    deletedAt: null
                },
                select: { id: true }
            });

            const submittedPayload = {
                requesterName: `${user.name} ${user.lastname}`,
                leaveType: leaveType.name,
                startDate: dateStart,
                endDate: dateEnd,
                actionUrl: `/requests`
            };

            outboxEvents.push(
                ...approvers.map((approver) => ({
                    dedupeKey: `leave:${leaveRequest.id}:submitted:approver:${approver.id}`,
                    kind: 'DIRECT_NOTIFICATION' as const,
                    companyId: user.companyId,
                    byUserId: sessionUser.id,
                    payload: {
                        userId: approver.id,
                        type: 'LEAVE_SUBMITTED' as const,
                        data: submittedPayload,
                        companyId: user.companyId
                    }
                }))
            );

            if (notificationWatcherIds.length > 0) {
                outboxEvents.push(
                    ...notificationWatcherIds.map((watcherId) => ({
                        dedupeKey: `leave:${leaveRequest.id}:submitted:watcher:${watcherId}`,
                        kind: 'DIRECT_NOTIFICATION' as const,
                        companyId: user.companyId,
                        byUserId: sessionUser.id,
                        payload: {
                            userId: watcherId,
                            type: 'LEAVE_SUBMITTED' as const,
                            data: submittedPayload,
                            companyId: user.companyId
                        }
                    }))
                );
            }
        }

        // 6.b Watcher Notifications for Workflow-driven approval (if it resulted in immediate approval)
        if (!isAutoApproved && !adminForcedStatus && status === LeaveStatus.APPROVED) {
            outboxEvents.push({
                dedupeKey: `leave:${leaveRequest.id}:watchers:approved`,
                kind: 'WATCHER_NOTIFICATION',
                companyId: user.companyId,
                byUserId: user.id,
                payload: {
                    leaveRequestId: leaveRequest.id,
                    type: 'LEAVE_APPROVED'
                }
            });
        }

        // 7. Send Approval Notification for Auto-Approved Requests or Admin-Forced
        if (isAutoApproved || (adminForcedStatus && status === LeaveStatus.APPROVED)) {
            const approverNameDisplay = adminForcedStatus ? 'Admin' : 'System';

            if (!adminForcedStatus || bodyUserId === sessionUser.id) {
                // If the user created it for themselves
                outboxEvents.push({
                    dedupeKey: `leave:${leaveRequest.id}:approved:requester:${user.id}`,
                    kind: 'DIRECT_NOTIFICATION',
                    companyId: user.companyId,
                    byUserId: sessionUser.id,
                    payload: {
                        userId: user.id,
                        type: 'LEAVE_APPROVED',
                        data: {
                            requesterName: `${user.name} ${user.lastname}`,
                            approverName: approverNameDisplay,
                            leaveType: leaveType.name,
                            startDate: dateStart,
                            endDate: dateEnd,
                            actionUrl: `/requests/${leaveRequest.id}`
                        },
                        companyId: user.companyId
                    }
                });
            } else if (adminForcedStatus && bodyUserId !== sessionUser.id) {
                // Admin created it for another user
                outboxEvents.push({
                    dedupeKey: `leave:${leaveRequest.id}:approved:requester:${user.id}`,
                    kind: 'DIRECT_NOTIFICATION',
                    companyId: user.companyId,
                    byUserId: sessionUser.id,
                    payload: {
                        userId: user.id,
                        type: 'LEAVE_APPROVED',
                        data: {
                            requesterName: `${user.name} ${user.lastname}`,
                            approverName: `${sessionUser.name} ${sessionUser.lastname}`,
                            leaveType: leaveType.name,
                            startDate: dateStart,
                            endDate: dateEnd,
                            actionUrl: `/requests/${leaveRequest.id}`
                        },
                        companyId: user.companyId
                    }
                });
            }

            outboxEvents.push({
                dedupeKey: `leave:${leaveRequest.id}:watchers:approved:system_or_admin`,
                kind: 'WATCHER_NOTIFICATION',
                companyId: user.companyId,
                byUserId: sessionUser.id,
                payload: {
                    leaveRequestId: leaveRequest.id,
                    type: 'LEAVE_APPROVED',
                    metadata: {
                        approverName: adminForcedStatus ? `${sessionUser.name} ${sessionUser.lastname}` : 'System',
                        projectId: projectId ?? undefined
                    }
                }
            });
        }

        if (outboxEvents.length > 0) {
            try {
                await NotificationOutboxService.enqueueMany(outboxEvents);
                NotificationOutboxService.kickoffProcessing();
            } catch (notificationQueueError) {
                console.error('[LEAVE_NOTIFICATION] Failed to enqueue notifications:', notificationQueueError);
            }
        }

        const successMessage =
            status === LeaveStatus.APPROVED
                ? (adminForcedStatus
                    ? (isAdminCreatingForOther ? 'Leave request created as approved.' : 'Leave request approved.')
                    : 'Leave request auto-approved.')
                : status === LeaveStatus.REJECTED
                    ? 'Leave request created as rejected.'
                    : 'Leave request submitted successfully.';

        return NextResponse.json({
            message: successMessage,
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
                byUser: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true
                    }
                },
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
