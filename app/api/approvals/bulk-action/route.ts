import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { z } from 'zod';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
import { WorkflowMasterRuntimeState } from '@/lib/types/workflow';

const bulkActionSchema = z.object({
    requestIds: z.array(z.string().uuid()),
    action: z.enum(['approve', 'reject']),
    comment: z.string().optional(),
});

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
                status: 'NEW' as any,
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
                        sequenceOrder: true
                    }
                });

                if (pendingSteps.length === 0 && !user.isAdmin) {
                    throw new Error(`No pending approval steps available for request ${requestRecord.id}`);
                }

                const minPendingSequence = pendingSteps.reduce((min, step) => {
                    const value = step.sequenceOrder ?? 999;
                    return Math.min(min, value);
                }, Number.MAX_SAFE_INTEGER);

                const actionableStepIds = pendingSteps
                    .filter((step) =>
                        (step.sequenceOrder ?? 999) === minPendingSequence &&
                        approverIds.includes(step.approverId)
                    )
                    .map((step) => step.id);
                const usedAdminOverride = user.isAdmin && actionableStepIds.length === 0;

                if (!user.isAdmin && actionableStepIds.length === 0) {
                    throw new Error(`Earlier approval steps are still pending for request ${requestRecord.id}`);
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
                        sequenceOrder: true
                    }
                });

                const outcome = action === 'reject'
                    ? { leaveStatus: LeaveStatus.REJECTED }
                    : WorkflowResolverService.aggregateOutcomeFromApprovalSteps(allSteps);

                const finalized = outcome.leaveStatus !== LeaveStatus.NEW;

                await tx.leaveRequest.update({
                    where: { id: requestRecord.id },
                    data: {
                        status: outcome.leaveStatus,
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
                        action === 'reject'
                            ? {
                                masterState: WorkflowMasterRuntimeState.REJECTED,
                                leaveStatus: LeaveStatus.REJECTED,
                                subFlowStates: []
                            }
                            : outcome,
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

                processed.push({
                    id: requestRecord.id,
                    status: outcome.leaveStatus,
                    requester: requestRecord.user,
                    leaveType: requestRecord.leaveType,
                    dateStart: requestRecord.dateStart,
                    dateEnd: requestRecord.dateEnd,
                    finalized
                });
            }

            return processed;
        });

        // Send notifications asynchronously to avoid blocking the response
        if (results.length > 0) {
            // Don't await this - let it run in the background
            Promise.resolve().then(async () => {
                try {
                    const finalizedResults = results.filter((result) => result.finalized);
                    console.log(`[BULK_NOTIFICATION] Processing ${finalizedResults.length} finalized ${action} actions for notifications`);
                    
                    for (const result of finalizedResults) {
                        if (result.status === LeaveStatus.APPROVED) {
                            console.log(`[BULK_NOTIFICATION] Sending APPROVED notification to user ${result.requester.id}`);
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
                            console.log(`[BULK_NOTIFICATION] Sending REJECTED notification to user ${result.requester.id}`);
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
                    console.log(`[BULK_NOTIFICATION] Successfully sent ${finalizedResults.length} notifications`);
                } catch (notificationError) {
                    console.error('[BULK_NOTIFICATION] Failed to send notifications:', notificationError);
                }
            }).catch(error => {
                console.error('[BULK_NOTIFICATION] Unhandled error in async notification:', error);
            });
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

        return NextResponse.json(
            { error: 'Failed to process bulk action' },
            { status: 500 }
        );
    }
}
