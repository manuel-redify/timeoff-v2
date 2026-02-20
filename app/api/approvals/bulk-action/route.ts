import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { $Enums } from '@/lib/generated/prisma/client';
import { z } from 'zod';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
import { WorkflowAggregateOutcome, WorkflowMasterRuntimeState } from '@/lib/types/workflow';

function toPrismaLeaveStatus(status: LeaveStatus): $Enums.LeaveStatus {
    return String(status).toUpperCase() as $Enums.LeaveStatus;
}

const bulkActionSchema = z.object({
    requestIds: z.array(z.string().uuid()),
    action: z.enum(['approve', 'reject']),
    comment: z.string().optional(),
});

class ActionValidationError extends Error {
    status: number;

    constructor(message: string, status: number = 409) {
        super(message);
        this.name = 'ActionValidationError';
        this.status = status;
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user with company info
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, companyId: true, name: true, lastname: true, isAdmin: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = bulkActionSchema.parse(body);

        const { requestIds, action, comment } = validatedData;

        // Validate: reject requires a comment
        if (action === 'reject' && !comment) {
            return NextResponse.json(
                { error: 'Comment is required when rejecting requests' },
                { status: 400 }
            );
        }

        // Check for active delegations
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const activeDelegations = await prisma.approvalDelegation.findMany({
            where: {
                delegateId: user.id,
                isActive: true,
                startDate: { lte: today },
                endDate: { gte: today },
            },
            select: { supervisorId: true },
        });

        const supervisorIds = activeDelegations.map((d) => d.supervisorId);
        const approverIds = [user.id, ...supervisorIds];

        // Verify all requests are pending and user is authorized to action them
        const leaveRequests = await prisma.leaveRequest.findMany({
            where: {
                id: { in: requestIds },
                status: toPrismaLeaveStatus(LeaveStatus.NEW),
                user: {
                    companyId: user.companyId,
                },
                ...(user.isAdmin ? {} : {
                    approvalSteps: {
                        some: {
                            approverId: { in: approverIds },
                            status: 0,
                        },
                    },
                }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
                leaveType: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (leaveRequests.length !== requestIds.length) {
            return NextResponse.json(
                {
                    error: 'Some requests are not found, already processed, or you are not authorized to action them',
                },
                { status: 400 }
            );
        }

        // Process requests under the same runtime invariants as single actions.
        const results = await prisma.$transaction(async (tx) => {
            const processed: Array<{
                id: string;
                status: LeaveStatus;
                requester: { id: string; name: string; lastname: string; email: string };
                leaveType: { id: string; name: string };
                dateStart: Date;
                dateEnd: Date;
                finalized: boolean;
                nextApproverIds: string[];
            }> = [];

            for (const requestRecord of leaveRequests) {
                const pendingSteps = await tx.approvalStep.findMany({
                    where: {
                        leaveId: requestRecord.id,
                        status: 0
                    },
                    select: {
                        id: true,
                        approverId: true,
                        status: true,
                        sequenceOrder: true,
                        policyId: true,
                        projectId: true
                    }
                });

                if (pendingSteps.length === 0 && !user.isAdmin) {
                    throw new ActionValidationError(
                        `No pending approval steps available for request ${requestRecord.id}`
                    );
                }

                const policyActionableIds: string[] = [];
                const policyGroups = pendingSteps.reduce((acc, step) => {
                    const pid = step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`;
                    if (!acc[pid]) acc[pid] = [];
                    acc[pid].push(step);
                    return acc;
                }, {} as Record<string, typeof pendingSteps>);

                for (const pid in policyGroups) {
                    const steps = policyGroups[pid];
                    const minSeq = Math.min(...steps.map(s => s.sequenceOrder ?? 999));
                    const actionable = steps.filter(
                        s => (s.sequenceOrder ?? 999) === minSeq && approverIds.includes(s.approverId)
                    );
                    policyActionableIds.push(...actionable.map(s => s.id));
                }

                const actionableStepIds = policyActionableIds;
                const usedAdminOverride = user.isAdmin && actionableStepIds.length === 0;

                if (!user.isAdmin && actionableStepIds.length === 0) {
                    throw new ActionValidationError(
                        `Earlier approval steps are still pending for request ${requestRecord.id}`
                    );
                }

                if (action === 'approve') {
                    if (actionableStepIds.length > 0) {
                        await tx.approvalStep.updateMany({
                            where: { id: { in: actionableStepIds } },
                            data: { status: 1, updatedAt: new Date() }
                        });
                    } else if (user.isAdmin) {
                        await tx.approvalStep.updateMany({
                            where: { leaveId: requestRecord.id, status: 0 },
                            data: { status: 1, updatedAt: new Date() }
                        });
                    }
                } else {
                    await tx.approvalStep.updateMany({
                        where: { leaveId: requestRecord.id, status: 0 },
                        data: { status: 2, updatedAt: new Date() }
                    });
                }

                const allSteps = await tx.approvalStep.findMany({
                    where: { leaveId: requestRecord.id },
                    select: {
                        id: true,
                        approverId: true,
                        status: true,
                        sequenceOrder: true,
                        policyId: true,
                        projectId: true
                    }
                });

                const outcome = action === 'reject'
                    ? {
                        masterState: WorkflowMasterRuntimeState.REJECTED,
                        leaveStatus: LeaveStatus.REJECTED,
                        subFlowStates: []
                    } satisfies WorkflowAggregateOutcome
                    : WorkflowResolverService.aggregateOutcomeFromApprovalSteps(allSteps);

                const finalized = outcome.leaveStatus !== LeaveStatus.NEW;

                await tx.leaveRequest.update({
                    where: { id: requestRecord.id },
                    data: {
                        status: toPrismaLeaveStatus(outcome.leaveStatus),
                        approverId: finalized ? user.id : null,
                        approverComment: finalized ? (comment || null) : null,
                        decidedAt: finalized ? new Date() : null,
                    }
                });

                const auditBase = {
                    leaveId: requestRecord.id,
                    companyId: user.companyId,
                    byUserId: user.id
                };
                const auditEvents = [
                    WorkflowAuditService.aggregatorOutcomeEvent(
                        auditBase,
                        outcome,
                        LeaveStatus.NEW
                    )
                ];

                if (usedAdminOverride && action === 'approve') {
                    auditEvents.push(
                        WorkflowAuditService.overrideApproveEvent(auditBase, {
                            actorId: user.id,
                            reason: comment ?? null,
                            previousStatus: LeaveStatus.NEW
                        })
                    );
                }

                if (usedAdminOverride && action === 'reject') {
                    auditEvents.push(
                        WorkflowAuditService.overrideRejectEvent(auditBase, {
                            actorId: user.id,
                            reason: comment ?? '',
                            previousStatus: LeaveStatus.NEW
                        })
                    );
                }

                await tx.audit.createMany({ data: auditEvents });

                let nextApproverIds: string[] = [];
                if (!finalized && action === 'approve') {
                    const pendingNext = allSteps.filter((step) => step.status === 0);
                    const actedSteps = pendingSteps.filter((step) => actionableStepIds.includes(step.id));
                    const affectedPolicyIds = new Set(
                        actedSteps.map((step) => step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`)
                    );

                    const nextGroups = pendingNext.reduce((acc, step) => {
                        const pid = step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`;
                        if (!acc[pid]) acc[pid] = [];
                        acc[pid].push(step);
                        return acc;
                    }, {} as Record<string, typeof pendingNext>);

                    const collected: string[] = [];
                    for (const pid in nextGroups) {
                        if (actionableStepIds.length > 0 && !affectedPolicyIds.has(pid)) continue;

                        const steps = nextGroups[pid];
                        const minSeq = Math.min(...steps.map(s => s.sequenceOrder ?? 999));
                        const inPolicy = steps
                            .filter(s => (s.sequenceOrder ?? 999) === minSeq)
                            .map(s => s.approverId);
                        collected.push(...inPolicy);
                    }

                    nextApproverIds = Array.from(new Set(collected));
                }

                processed.push({
                    id: requestRecord.id,
                    status: outcome.leaveStatus,
                    requester: requestRecord.user,
                    leaveType: requestRecord.leaveType,
                    dateStart: requestRecord.dateStart,
                    dateEnd: requestRecord.dateEnd,
                    finalized,
                    nextApproverIds
                });
            }

            return processed;
        });

        // Ensure notification side effects run before route completion.
        if (results.length > 0) {
            try {
                const finalizedResults = results.filter((result) => result.finalized);
                const inProgressResults = results.filter((result) => !result.finalized);

                for (const result of finalizedResults) {
                    if (result.status === LeaveStatus.APPROVED) {
                        await NotificationService.notify(
                            result.requester.id,
                            'LEAVE_APPROVED',
                            {
                                requesterName: `${result.requester.name} ${result.requester.lastname}`,
                                approverName: `${user.name} ${user.lastname}`,
                                leaveType: result.leaveType.name,
                                startDate: result.dateStart.toISOString(),
                                endDate: result.dateEnd.toISOString(),
                                comment: comment || undefined,
                                actionUrl: `/requests/${result.id}`
                            },
                            user.companyId
                        );
                        await WatcherService.notifyWatchers(result.id, 'LEAVE_APPROVED');
                    } else if (result.status === LeaveStatus.REJECTED) {
                        await NotificationService.notify(
                            result.requester.id,
                            'LEAVE_REJECTED',
                            {
                                requesterName: `${result.requester.name} ${result.requester.lastname}`,
                                approverName: `${user.name} ${user.lastname}`,
                                leaveType: result.leaveType.name,
                                startDate: result.dateStart.toISOString(),
                                endDate: result.dateEnd.toISOString(),
                                comment: comment || undefined,
                                actionUrl: `/requests/${result.id}`
                            },
                            user.companyId
                        );
                        await WatcherService.notifyWatchers(result.id, 'LEAVE_REJECTED');
                    }
                }

                for (const result of inProgressResults) {
                    if (action !== 'approve' || result.nextApproverIds.length === 0) {
                        continue;
                    }

                    await Promise.all(
                        result.nextApproverIds.map((approverId) =>
                            NotificationService.notify(
                                approverId,
                                'LEAVE_SUBMITTED',
                                {
                                    requesterName: `${result.requester.name} ${result.requester.lastname}`,
                                    leaveType: result.leaveType.name,
                                    startDate: result.dateStart.toISOString().split('T')[0],
                                    endDate: result.dateEnd.toISOString().split('T')[0],
                                    actionUrl: `/requests/${result.id}`
                                },
                                user.companyId
                            )
                        )
                    );
                }
            } catch (notificationError) {
                console.error('[BULK_NOTIFICATION] Failed to send notifications:', notificationError);
            }
        }

        return NextResponse.json({
            success: true,
            action,
            processed: results.length,
            results,
        });
    } catch (error) {
        console.error('Bulk approval action error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.issues },
                { status: 400 }
            );
        }
        if (error instanceof ActionValidationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to process bulk action' },
            { status: 500 }
        );
    }
}
