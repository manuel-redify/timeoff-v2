import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id },
            include: {
                leaveType: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true
                    }
                },
                approvalSteps: {
                    include: {
                        approver: {
                            select: {
                                id: true,
                                name: true,
                                lastname: true
                            }
                        }
                    },
                    orderBy: {
                        sequenceOrder: 'asc'
                    }
                }
            }
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        // Check if user has permission to view this request
        const canView =
            user.isAdmin ||
            leaveRequest.userId === user.id ||
            leaveRequest.approvalSteps.some(s => s.approverId === user.id);

        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(leaveRequest);
    } catch (error) {
        console.error('Error fetching leave request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
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

        // Authorization: Only requester or admin can cancel
        if (leaveRequest.userId !== user.id && !user.isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Status restriction: Only NEW requests can be canceled via DELETE
        // APPROVED requests must be REVOKED.
        if (leaveRequest.status !== LeaveStatus.NEW) {
            return NextResponse.json({ error: 'Only pending requests can be canceled. Approved requests must be revoked.' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.leaveRequest.update({
                where: { id: leaveId },
                data: {
                    status: LeaveStatus.CANCELED,
                    updatedAt: new Date()
                }
            });

            // Also cancel any pending approval steps
            await tx.approvalStep.updateMany({
                where: {
                    leaveId: leaveId,
                    status: 1 // pending
                },
                data: {
                    status: 3, // mark as rejected/canceled contextually
                    updatedAt: new Date()
                }
            });
        });

        return NextResponse.json({ message: 'Request canceled successfully' });

    } catch (error) {
        console.error('Error canceling leave request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
