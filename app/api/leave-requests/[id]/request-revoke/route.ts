import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { isBefore, isSameDay, startOfDay } from 'date-fns';

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
        const { reason } = body;

        if (!reason || !reason.trim()) {
            return NextResponse.json({ error: 'A reason is required for revocation requests' }, { status: 400 });
        }

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

        const normalizedStatus = String(leaveRequest.status).toUpperCase();
        const today = startOfDay(new Date());
        const leaveStart = startOfDay(leaveRequest.dateStart);
        const hasStarted = isBefore(leaveStart, today) || isSameDay(leaveStart, today);

        if (normalizedStatus !== 'APPROVED') {
            return NextResponse.json({ error: 'Only approved requests can be revoked.' }, { status: 400 });
        }

        if (!hasStarted) {
            return NextResponse.json({
                error: 'Approved requests can be revoked only on or after their start date. Future approved requests must be canceled instead.'
            }, { status: 400 });
        }

        await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status: 'PENDING_REVOKE' as any,
                employeeComment: reason.trim(),
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
