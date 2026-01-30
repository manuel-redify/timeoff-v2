import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { z } from 'zod';
import { NotificationService } from '@/lib/services/notification.service';

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
            select: { id: true, companyId: true, name: true, lastname: true },
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
                approvalSteps: {
                    some: {
                        approverId: { in: approverIds },
                        status: 0, // Pending
                    },
                },
            },
include: {
                approvalSteps: {
                    where: {
                        approverId: { in: approverIds },
                        status: 0,
                    },
                },
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

        // Process all requests in a transaction with batched operations
        const results = await prisma.$transaction(async (tx) => {
            const processed = [];
            const newStatus = (action === 'approve' ? 'APPROVED' : 'REJECTED') as any;
            const stepStatus = action === 'approve' ? 1 : 2; // 1 = approved, 2 = rejected

            // Batch update all leave requests
            const updatedRequests = await tx.leaveRequest.updateMany({
                where: { id: { in: requestIds } },
                data: {
                    status: newStatus,
                    approverId: user.id,
                    approverComment: comment || null,
                    decidedAt: new Date(),
                },
            });

            // Batch update all approval steps
            const approvalSteps = await tx.approvalStep.updateMany({
                where: {
                    leaveId: { in: requestIds },
                    approverId: { in: approverIds },
                    status: 0,
                },
                data: { status: stepStatus },
            });

            // Get updated requests for notification data
            const updatedLeaveRequests = await tx.leaveRequest.findMany({
                where: { id: { in: requestIds } },
                select: {
                    id: true,
                    status: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            lastname: true,
                            email: true,
                        },
                    },
                    approvalSteps: {
                        where: {
                            approverId: { in: approverIds },
                        },
                        select: {
                            id: true,
                            approverId: true,
                        },
                    },
                },
            });

            // Create audit logs in batch
            const auditLogs = updatedLeaveRequests.map(request => ({
                entityType: 'leave_request' as const,
                entityId: request.id,
                attribute: 'status' as const,
                oldValue: 'NEW' as any,
                newValue: newStatus,
                companyId: user.companyId,
                byUserId: user.id,
            }));

            await tx.audit.createMany({ data: auditLogs });

            // Check for delegated approvals and create additional audit logs
            const delegationLogs = [];
            for (const request of updatedLeaveRequests) {
                const approvalStep = request.approvalSteps[0];
                if (approvalStep && supervisorIds.includes(approvalStep.approverId)) {
                    delegationLogs.push({
                        entityType: 'leave_request' as const,
                        entityId: request.id,
                        attribute: 'approval_method' as const,
                        oldValue: null,
                        newValue: `Approved via delegation from ${approvalStep.approverId}`,
                        companyId: user.companyId,
                        byUserId: user.id,
                    });
                }
            }

            if (delegationLogs.length > 0) {
                await tx.audit.createMany({ data: delegationLogs });
            }

            return updatedLeaveRequests.map(request => ({
                id: request.id,
                status: request.status,
                requester: request.user,
            }));
        });

        // Send notifications asynchronously to avoid blocking the response
        if (results.length > 0) {
            // Don't await this - let it run in the background
            Promise.resolve().then(async () => {
                try {
                    console.log(`[BULK_NOTIFICATION] Processing ${results.length} ${action} actions for notifications`);
                    
                    for (const result of results) {
                        const leaveRequest = leaveRequests.find(lr => lr.id === result.id);
                        if (!leaveRequest) continue;

                        if (action === 'approve') {
                            console.log(`[BULK_NOTIFICATION] Sending APPROVED notification to user ${result.requester.id}`);
                            await NotificationService.notify(
                                result.requester.id,
                                'LEAVE_APPROVED',
                                {
                                    requesterName: `${result.requester.name} ${result.requester.lastname}`,
                                    approverName: `${user.name} ${user.lastname}`,
                                    leaveType: leaveRequest.leaveType.name,
                                    startDate: leaveRequest.dateStart.toISOString(),
                                    endDate: leaveRequest.dateEnd.toISOString(),
                                    comment: comment || undefined,
                                    actionUrl: `/requests/${result.id}`
                                },
                                user.companyId
                            );
                        } else if (action === 'reject') {
                            console.log(`[BULK_NOTIFICATION] Sending REJECTED notification to user ${result.requester.id}`);
                            await NotificationService.notify(
                                result.requester.id,
                                'LEAVE_REJECTED',
                                {
                                    requesterName: `${result.requester.name} ${result.requester.lastname}`,
                                    approverName: `${user.name} ${user.lastname}`,
                                    leaveType: leaveRequest.leaveType.name,
                                    startDate: leaveRequest.dateStart.toISOString(),
                                    endDate: leaveRequest.dateEnd.toISOString(),
                                    comment: comment || undefined,
                                    actionUrl: `/requests/${result.id}`
                                },
                                user.companyId
                            );
                        }
                    }
                    console.log(`[BULK_NOTIFICATION] Successfully sent ${results.length} notifications`);
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
