import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';

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
                        email: true,
                        company: {
                            select: {
                                minutesPerDay: true
                            }
                        },
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                byUser: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
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
                        },
                        role: {
                            select: {
                                name: true
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

        // Status restriction: Only NEW requests can be removed via DELETE.
        // APPROVED requests must be revoked using the dedicated revoke flow.
        if ((leaveRequest.status as string).toUpperCase() !== 'NEW') {
            return NextResponse.json({ error: 'Only pending requests can be removed. Approved requests must be revoked.' }, { status: 400 });
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

        return NextResponse.json({ message: 'Request removed successfully. Create a new request to submit changes.' });

    } catch (error) {
        console.error('Error canceling leave request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
