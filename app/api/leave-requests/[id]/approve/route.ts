import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
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

        if ((leaveRequest.status as string).toUpperCase() !== 'NEW') {
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
                    status: 'APPROVED' as any,
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
                        sequenceOrder: true,
                        policyId: true,
                        projectId: true
                    }
                });

                if (pendingSteps.length === 0 && !user.isAdmin) {
                    throw new Error('No pending approval step for this user');
                }

                // Group steps by policyId for independent progression
                // Fallback: use projectId if policyId is null (for backwards compatibility)
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
                    const actionable = steps.filter(s => (s.sequenceOrder ?? 999) === minSeq && s.approverId === user.id);
                    policyActionableIds.push(...actionable.map(s => s.id));
                }

                const actionableStepIds = policyActionableIds;
                const usedAdminOverride = actionableStepIds.length === 0 && user.isAdmin;

                if (actionableStepIds.length === 0 && !user.isAdmin) {
                    throw new Error('Earlier approval steps for your specific role/project must be completed first');
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
                        sequenceOrder: true,
                        policyId: true,
                        projectId: true
                    }
                });

                const outcome = WorkflowResolverService.aggregateOutcomeFromApprovalSteps(allSteps);

                if ((outcome.leaveStatus as string).toUpperCase() === 'APPROVED') {
                    await tx.leaveRequest.update({
                        where: { id: leaveId },
                        data: {
                            status: 'APPROVED' as any,
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

                const auditBase = {
                    leaveId,
                    companyId: leaveRequest.user.companyId,
                    byUserId: user.id
                };
                const auditEvents = [
                    WorkflowAuditService.aggregatorOutcomeEvent(
                        auditBase,
                        outcome,
                        leaveRequest.status as any
                    )
                ];

                if (usedAdminOverride) {
                    auditEvents.push(
                        WorkflowAuditService.overrideApproveEvent(auditBase, {
                            actorId: user.id,
                            reason: comment ?? null,
                            previousStatus: leaveRequest.status as any
                        })
                    );
                }

                await tx.audit.createMany({ data: auditEvents });

                // Calculate next approvers per policy to allow independent notifications
                const pendingNext = allSteps.filter(s => s.status === 0);

                // Determine which policies were actually advanced in this transaction
                const actedSteps = pendingSteps.filter(s => actionableStepIds.includes(s.id));
                const affectedPolicyIds = new Set(actedSteps.map(s => s.policyId || `PROJECT_${s.projectId || 'UNKNOWN'}`));

                const nextApproverIds: string[] = [];
                const nextGroups = pendingNext.reduce((acc, step) => {
                    const pid = step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`;
                    if (!acc[pid]) acc[pid] = [];
                    acc[pid].push(step);
                    return acc;
                }, {} as Record<string, typeof pendingNext>);

                for (const pid in nextGroups) {
                    // Only notify if this policy was affected by the current action
                    // Exception: If it's an admin override that affected everything, we might want wide notifications,
                    // but usually admin overrides also use actionableStepIds logic unless it's a "force all" scenario.
                    // If actionableStepIds has items, we respect the policy filter.
                    if (actionableStepIds.length > 0 && !affectedPolicyIds.has(pid)) continue;

                    const steps = nextGroups[pid];
                    const minSeq = Math.min(...steps.map(s => s.sequenceOrder ?? 999));
                    const inPolicy = steps.filter(s => (s.sequenceOrder ?? 999) === minSeq).map(s => s.approverId);
                    nextApproverIds.push(...inPolicy);
                }

                return {
                    message: 'Step approved successfully. Pending further steps.',
                    isFinalApproval: false,
                    nextApproverIds: Array.from(new Set(nextApproverIds))
                };
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
            } else if (result.nextApproverIds && result.nextApproverIds.length > 0) {
                // Notify NEXT approvers
                const requestWithIncludes = await prisma.leaveRequest.findUnique({
                    where: { id: leaveId },
                    include: {
                        user: { include: { company: true } },
                        leaveType: true
                    }
                });

                if (requestWithIncludes) {
                    await Promise.all(
                        result.nextApproverIds.map(approverId =>
                            NotificationService.notify(
                                approverId,
                                'LEAVE_SUBMITTED',
                                {
                                    requesterName: `${requestWithIncludes.user.name} ${requestWithIncludes.user.lastname}`,
                                    leaveType: requestWithIncludes.leaveType.name,
                                    startDate: requestWithIncludes.dateStart.toISOString().split('T')[0],
                                    endDate: requestWithIncludes.dateEnd.toISOString().split('T')[0],
                                    actionUrl: `/requests`
                                },
                                requestWithIncludes.user.companyId
                            )
                        )
                    );
                }
            }
            return NextResponse.json({ message: result.message, isFinalApproval: result.isFinalApproval });
        }

    } catch (error: any) {
        console.error('Error approving leave request:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
