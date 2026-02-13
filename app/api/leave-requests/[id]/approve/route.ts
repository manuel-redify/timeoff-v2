import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';

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

        if (leaveRequest.status !== LeaveStatus.NEW) {
            return NextResponse.json({ error: 'Request is not in a state that can be approved' }, { status: 400 });
        }

        // Self-approval prevention
        if (leaveRequest.userId === user.id && !user.isAdmin) {
            return NextResponse.json({ error: 'You cannot approve your own leave request' }, { status: 403 });
        }

        const companyMode = leaveRequest.user.company.mode;

        if (companyMode === 1) {
            // Basic Mode
            const routing = await ApprovalRoutingService.getApprovers(leaveRequest.userId);
            const isAuthorized = routing.approvers.some(a => a.id === user.id) || user.isAdmin;

            if (!isAuthorized) {
                return NextResponse.json({ error: 'Not authorized to approve this request' }, { status: 403 });
            }

            const updatedRequest = await prisma.leaveRequest.update({
                where: { id: leaveId },
                data: {
                    status: LeaveStatus.APPROVED,
                    approverId: user.id,
                    approverComment: comment,
                    decidedAt: new Date()
                }
            });

            // Notify requester
            await NotificationService.notify(
                leaveRequest.userId,
                'LEAVE_APPROVED',
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
            await WatcherService.notifyWatchers(leaveId, 'LEAVE_APPROVED');

            return NextResponse.json({ message: 'Request approved successfully' });
        } else {
            // Advanced Mode
            const result = await prisma.$transaction(async (tx) => {
                const pendingSteps = await tx.approvalStep.findMany({
                    where: {
                        leaveId: leaveId,
                        status: 0 // pending
                    },
                    select: {
                        id: true,
                        approverId: true,
                        status: true,
                        sequenceOrder: true
                    }
                });

                if (pendingSteps.length === 0 && !user.isAdmin) {
                    throw new Error('No pending approval step for this user');
                }

                const minPendingSequence = pendingSteps.reduce((min, step) => {
                    const value = step.sequenceOrder ?? 999;
                    return Math.min(min, value);
                }, Number.MAX_SAFE_INTEGER);

                const actionableStepIds = pendingSteps
                    .filter((step) => (step.sequenceOrder ?? 999) === minPendingSequence && step.approverId === user.id)
                    .map((step) => step.id);

                if (actionableStepIds.length === 0 && !user.isAdmin) {
                    throw new Error('Earlier approval steps must be completed first');
                }

                if (actionableStepIds.length > 0) {
                    await tx.approvalStep.updateMany({
                        where: { id: { in: actionableStepIds } },
                        data: { status: 1, updatedAt: new Date() }
                    });
                } else if (user.isAdmin) {
                    await tx.approvalStep.updateMany({
                        where: { leaveId, status: 0 },
                        data: { status: 1, updatedAt: new Date() }
                    });
                }

                const allSteps = await tx.approvalStep.findMany({
                    where: { leaveId },
                    select: {
                        id: true,
                        approverId: true,
                        status: true,
                        sequenceOrder: true
                    }
                });

                const outcome = WorkflowResolverService.aggregateOutcomeFromApprovalSteps(allSteps);

                if (outcome.leaveStatus === LeaveStatus.APPROVED) {
                    await tx.leaveRequest.update({
                        where: { id: leaveId },
                        data: {
                            status: LeaveStatus.APPROVED,
                            approverId: user.id,
                            approverComment: comment,
                            decidedAt: new Date()
                        }
                    });
                    
                    return { 
                        message: 'Final approval received. Request is now approved.',
                        isFinalApproval: true
                    };
                }

                return { message: 'Step approved successfully. Pending further steps.', isFinalApproval: false };
            });

            // Handle notifications after transaction
            if (result.isFinalApproval) {
                // Fetch fresh data with includes for notification
                const requestWithIncludes = await prisma.leaveRequest.findUnique({
                    where: { id: leaveId },
                    include: {
                        user: { include: { company: true } },
                        leaveType: true
                    }
                });
                
                if (requestWithIncludes) {
                    // Notify requester
                    await NotificationService.notify(
                        requestWithIncludes.userId,
                        'LEAVE_APPROVED',
                        {
                            requesterName: `${requestWithIncludes.user.name} ${requestWithIncludes.user.lastname}`,
                            approverName: `${user.name} ${user.lastname}`,
                            leaveType: requestWithIncludes.leaveType.name,
                            startDate: requestWithIncludes.dateStart.toISOString().split('T')[0],
                            endDate: requestWithIncludes.dateEnd.toISOString().split('T')[0],
                            comment: comment,
                            actionUrl: `/requests`
                        },
                        requestWithIncludes.user.companyId
                    );
                    
                    // Notify watchers
                    await WatcherService.notifyWatchers(leaveId, 'LEAVE_APPROVED');
                }
            }
            return NextResponse.json(result);
        }

    } catch (error: any) {
        console.error('Error approving leave request:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
