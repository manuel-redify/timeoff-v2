import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { WorkflowMasterRuntimeState } from '@/lib/types/workflow';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: leaveId } = await params;
        const body = await request.json();
        const { comment } = body;

        if (!comment || comment.trim().length === 0) {
            return NextResponse.json({ error: 'Rejection comment is required' }, { status: 400 });
        }

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: {
                user: {
                    include: { company: true }
                },
                leaveType: true
            }
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        if ((leaveRequest.status as string).toUpperCase() !== 'NEW') {
            return NextResponse.json({ error: 'Request is not in a state that can be rejected' }, { status: 400 });
        }

        // Authorization check
        const companyMode = leaveRequest.user.company.mode;
        let isAuthorized = user.isAdmin;
        let usedAdminOverride = false;

        if (companyMode === 1) {
            const routing = await ApprovalRoutingService.getApprovers(leaveRequest.userId);
            isAuthorized = isAuthorized || routing.approvers.some(a => a.id === user.id);
        } else {
            const pendingSteps = await prisma.approvalStep.findMany({
                where: {
                    leaveId: leaveId,
                    status: 0 // pending
                },
                select: {
                    approverId: true,
                    sequenceOrder: true
                }
            });

            const minPendingSequence = pendingSteps.reduce((min, step) => {
                const value = step.sequenceOrder ?? 999;
                return Math.min(min, value);
            }, Number.MAX_SAFE_INTEGER);

            const requesterHasActionableStep = pendingSteps.some((step) =>
                step.approverId === user.id && (step.sequenceOrder ?? 999) === minPendingSequence
            );

            isAuthorized = isAuthorized || requesterHasActionableStep;
            usedAdminOverride = user.isAdmin && !requesterHasActionableStep;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Not authorized to reject this request' }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
            // Update request
            await tx.leaveRequest.update({
                where: { id: leaveId },
                data: {
                    status: 'REJECTED' as any,
                    approverId: user.id,
                    approverComment: comment,
                    decidedAt: new Date()
                }
            });

            // Update all pending steps in advanced mode
            if (companyMode !== 1) {
                await tx.approvalStep.updateMany({
                    where: {
                        leaveId: leaveId,
                        status: 0 // pending
                    },
                    data: {
                        status: 2, // rejected
                        updatedAt: new Date()
                    }
                });

                // Ensure runtime aggregation sees terminal rejection branch closure.
                const allSteps = await tx.approvalStep.findMany({
                    where: { leaveId },
                    select: {
                        id: true,
                        approverId: true,
                        status: true,
                        sequenceOrder: true
                    }
                });
                WorkflowResolverService.aggregateOutcomeFromApprovalSteps(allSteps);
            }

            const auditBase = {
                leaveId,
                companyId: leaveRequest.user.companyId,
                byUserId: user.id
            };

            const rejectedOutcome = {
                masterState: WorkflowMasterRuntimeState.REJECTED,
                leaveStatus: 'REJECTED' as any,
                subFlowStates: []
            };

            const auditEvents = [
                WorkflowAuditService.aggregatorOutcomeEvent(
                    auditBase,
                    rejectedOutcome,
                    leaveRequest.status as any
                )
            ];

            if (usedAdminOverride) {
                auditEvents.push(
                    WorkflowAuditService.overrideRejectEvent(auditBase, {
                        actorId: user.id,
                        reason: comment,
                        previousStatus: leaveRequest.status as any
                    })
                );
            }

            await tx.audit.createMany({ data: auditEvents });
        });

        // Notify requester
        await NotificationService.notify(
            leaveRequest.userId,
            'LEAVE_REJECTED',
            {
                requesterName: `${leaveRequest.user.name} ${leaveRequest.user.lastname}`,
                approverName: `${user.name} ${user.lastname}`,
                leaveType: leaveRequest.leaveType.name,
                startDate: leaveRequest.dateStart.toISOString().split('T')[0],
                endDate: leaveRequest.dateEnd.toISOString().split('T')[0],
                comment: comment,
                actionUrl: `/requests`
            },
            leaveRequest.user.companyId
        );

        // Notify watchers
        await WatcherService.notifyWatchers(leaveId, 'LEAVE_REJECTED');

        return NextResponse.json({ message: 'Request rejected successfully' });

    } catch (error: any) {
        console.error('Error rejecting leave request:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
