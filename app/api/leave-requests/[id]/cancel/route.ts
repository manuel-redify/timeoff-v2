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

        // Status restriction: NEW or APPROVED can be canceled
        const status = leaveRequest.status;
        const allowedStatuses = ['NEW' as any, 'APPROVED' as any];

        if (!allowedStatuses.includes(status as any)) {
            return NextResponse.json({
                error: `Only New or Approved requests can be canceled. Current status: ${leaveRequest.status}`
            }, { status: 400 });
        }

        // Perform cancellation
        await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: 'CANCELED' as any,
                // We assume approvals don't need to be deleted, just ignored by dashboard based on status
            }
        });

        // Notify approver if request was pending
        if (leaveRequest.status === ('NEW' as any) && leaveRequest.approverId) {
            await NotificationService.notify(
                leaveRequest.approverId,
                'LEAVE_REJECTED', // Using REJECTED notification type for cancellation
                {
                    requesterName: `${leaveRequest.user!.name} ${leaveRequest.user!.lastname}`,
                    approverName: `${leaveRequest.user!.name} ${leaveRequest.user!.lastname}`,
                    leaveType: leaveRequest.leaveType!.name,
                    startDate: leaveRequest.dateStart.toISOString().split('T')[0],
                    endDate: leaveRequest.dateEnd.toISOString().split('T')[0],
                    comment: 'Request canceled by user',
                    actionUrl: `/requests`
                },
                leaveRequest.user!.companyId
            );
        }

        // Notify watchers
        await WatcherService.notifyWatchers(leaveId, 'LEAVE_REJECTED');

        return NextResponse.json({ message: 'Request canceled successfully' });

    } catch (error) {
        console.error('Error canceling leave request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
