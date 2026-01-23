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

        // Authorization: Only original approver or admin can approve revocation
        if (leaveRequest.approverId !== user.id && !user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Status restriction: Only PENDING_REVOKE requests can be approved for revocation
        if (leaveRequest.status !== LeaveStatus.PENDING_REVOKE) {
            return NextResponse.json({ error: 'Request is not pending revocation.' }, { status: 400 });
        }

        await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: 'CANCELED' as any,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ message: 'Revocation approved successfully. Request is now canceled.' });

    } catch (error) {
        console.error('Error approving leave revocation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
