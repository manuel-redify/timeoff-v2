import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
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

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: {
                user: { include: { company: true } },
                leaveType: true,
                approver: true
            }
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Authorization: Only requester can cancel (for now)
        if (leaveRequest.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Status restriction: only NEW can be removed here.
        // Approved requests must go through revoke flow.
        const status = leaveRequest.status;
        const allowedStatuses = ['NEW' as any];

        if (!allowedStatuses.includes(status as any)) {
            return NextResponse.json({
                error: `Only New requests can be removed here. Approved requests must be revoked. Current status: ${leaveRequest.status}`
            }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.leaveRequest.update({
                where: { id: leaveId },
                data: {
                    status: 'CANCELED' as any,
                    deletedAt: new Date(),
                    updatedAt: new Date()
                }
            });

            await tx.approvalStep.updateMany({
                where: {
                    leaveId,
                    status: 0
                },
                data: {
                    status: 3,
                    updatedAt: new Date()
                }
            });
        });

        if (leaveRequest.approverId) {
            await NotificationService.notify(
                leaveRequest.approverId,
                'LEAVE_REJECTED',
                {
                    requesterName: `${leaveRequest.user!.name} ${leaveRequest.user!.lastname}`,
                    approverName: `${leaveRequest.user!.name} ${leaveRequest.user!.lastname}`,
                    leaveType: leaveRequest.leaveType!.name,
                    startDate: leaveRequest.dateStart.toISOString().split('T')[0],
                    endDate: leaveRequest.dateEnd.toISOString().split('T')[0],
                    comment: 'Request removed by requester (immutable workflow policy)',
                    actionUrl: `/requests`
                },
                leaveRequest.user!.companyId
            );
        }

        await WatcherService.notifyWatchers(leaveId, 'LEAVE_REJECTED');

        return NextResponse.json({ message: 'Request removed successfully. Create a new request to submit changes.' });

    } catch (error) {
        console.error('Error canceling leave request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
