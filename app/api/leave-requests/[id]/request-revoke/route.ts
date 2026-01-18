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

        // Authorization: Only requester or admin can request revocation
        if (leaveRequest.userId !== user.id && !user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Status restriction: Only APPROVED requests can be revoked
        if (leaveRequest.status !== LeaveStatus.APPROVED) {
            return NextResponse.json({ error: 'Only approved requests can be revoked.' }, { status: 400 });
        }

        await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: LeaveStatus.PENDING_REVOKE,
                updatedAt: new Date()
            }
        });

        // TODO: Notify original approver
        // This will be handled in Phase 9

        return NextResponse.json({ message: 'Revocation request submitted successfully' });

    } catch (error) {
        console.error('Error requesting leave revocation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
