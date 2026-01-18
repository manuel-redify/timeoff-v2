import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';

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
        const { comment } = body;

        if (!comment || comment.trim().length === 0) {
            return NextResponse.json({ error: 'Rejection comment is required' }, { status: 400 });
        }

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: {
                user: {
                    include: { company: true }
                }
            }
        });

        if (!leaveRequest) {
            return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
        }

        if (leaveRequest.status !== LeaveStatus.NEW) {
            return NextResponse.json({ error: 'Request is not in a state that can be rejected' }, { status: 400 });
        }

        // Authorization check
        const companyMode = leaveRequest.user.company.mode;
        let isAuthorized = user.isAdmin;

        if (companyMode === 1) {
            const routing = await ApprovalRoutingService.getApprovers(leaveRequest.userId);
            isAuthorized = isAuthorized || routing.approvers.some(a => a.id === user.id);
        } else {
            const currentStep = await prisma.approvalStep.findFirst({
                where: {
                    leaveId: leaveId,
                    approverId: user.id,
                    status: 1 // pending
                }
            });
            isAuthorized = isAuthorized || !!currentStep;
        }

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Not authorized to reject this request' }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
            // Update request
            await tx.leaveRequest.update({
                where: { id: leaveId },
                data: {
                    status: LeaveStatus.REJECTED,
                    approverId: user.id,
                    approverComment: comment,
                    decidedAt: new Date()
                }
            });

            // Update all pending steps in advanced mode
            if (companyMode !== 1) {
                await tx.approvalStep.updateMany({
                    where: {
                        leaveId: leaveId,
                        status: 1 // pending
                    },
                    data: {
                        status: 3, // rejected
                        updatedAt: new Date()
                    }
                });
            }
        });

        return NextResponse.json({ message: 'Request rejected successfully' });

    } catch (error: any) {
        console.error('Error rejecting leave request:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
