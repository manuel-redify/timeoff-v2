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

        // Process all requests in a transaction
        const results = await prisma.$transaction(async (tx) => {
            const processed = [];

            for (const leaveRequest of leaveRequests) {
                const approvalStep = leaveRequest.approvalSteps[0];
                if (!approvalStep) continue;

                const newStatus = (action === 'approve' ? 'APPROVED' : 'REJECTED') as any;

                // Update the leave request
                const updated = await tx.leaveRequest.update({
                    where: { id: leaveRequest.id },
                    data: {
                        status: newStatus,
                        approverId: user.id,
                        approverComment: comment || null,
                        decidedAt: new Date(),
                    },
                });

                // Update the approval step
                await tx.approvalStep.update({
                    where: { id: approvalStep.id },
                    data: {
                        status: action === 'approve' ? 1 : 2, // 1 = approved, 2 = rejected
                    },
                });

                // Create audit log
                await tx.audit.create({
                    data: {
                        entityType: 'leave_request',
                        entityId: leaveRequest.id,
                        attribute: 'status',
                        oldValue: 'NEW' as any,
                        newValue: newStatus,
                        companyId: user.companyId,
                        byUserId: user.id,
                    },
                });

                // Check if this was a delegated approval
                const isDelegated = supervisorIds.includes(approvalStep.approverId);
                if (isDelegated) {
                    await tx.audit.create({
                        data: {
                            entityType: 'leave_request',
                            entityId: leaveRequest.id,
                            attribute: 'approval_method',
                            oldValue: null,
                            newValue: `Approved via delegation from ${approvalStep.approverId}`,
                            companyId: user.companyId,
                            byUserId: user.id,
                        },
                    });
                }

processed.push({
                    id: updated.id,
                    status: updated.status,
                    requester: leaveRequest.user,
                });
            }

            return processed;
        });

        // Send notifications after successful transaction
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
            // Don't fail the request, but log the error
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
