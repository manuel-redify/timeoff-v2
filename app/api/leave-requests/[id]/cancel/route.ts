import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';

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
            where: { id: leaveId }
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Authorization: Only requester can cancel (for now)
        if (leaveRequest.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Status restriction: NEW or APPROVED can be canceled
        const status = typeof leaveRequest.status === 'string' ? leaveRequest.status.toUpperCase() : '';
        const allowedStatuses = ['NEW', 'APPROVED'];

        if (!allowedStatuses.includes(status)) {
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

        return NextResponse.json({ message: 'Request canceled successfully' });

    } catch (error) {
        console.error('Error canceling leave request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
