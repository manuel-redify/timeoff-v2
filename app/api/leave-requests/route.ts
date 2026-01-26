import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import { LeaveValidationService } from '@/lib/leave-validation-service';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { DayPart, LeaveStatus } from '@/lib/generated/prisma/enums';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            leaveTypeId,
            dateStart,
            dayPartStart,
            dateEnd,
            dayPartEnd,
            employeeComment,
            projectId // Optional, for advanced routing
        } = body;

        // 1. Validation
        const validation = await LeaveValidationService.validateRequest(
            user.id,
            leaveTypeId,
            new Date(dateStart),
            dayPartStart as DayPart,
            new Date(dateEnd),
            dayPartEnd as DayPart,
            employeeComment
        );

        if (!validation.isValid) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.errors
            }, { status: 400 });
        }

        // 2. Fetch Leave Type to check auto-approve
        const leaveType = await prisma.leaveType.findUnique({
            where: { id: leaveTypeId }
        });

        if (!leaveType) {
            return NextResponse.json({ error: 'Leave type not found' }, { status: 404 });
        }

        // 3. Determine Status and Approver
        let status: any = 'NEW';
        let approverId: string | null = null;
        let decidedAt: Date | null = null;

        const isAutoApproved =
            user.isAutoApprove ||
            leaveType.autoApprove ||
            user.contractType === 'Contractor';

        if (isAutoApproved) {
            status = 'APPROVED';
            approverId = user.id; // Self or System
            decidedAt = new Date();
        }

        // 4. Determine Routing (if not auto-approved)
        let routingResult = null;
        if (!isAutoApproved) {
            routingResult = await ApprovalRoutingService.getApprovers(user.id, projectId);

            // If no approvers found even with fallback, we might have a problem
            if (routingResult.mode === 'basic' && routingResult.approvers.length === 0) {
                // Should fallback to any admin in the routing service, but if still empty:
                return NextResponse.json({ error: 'No valid approvers found for this request. Please contact your administrator.' }, { status: 400 });
            }
        }

        // 5. Create Request and Steps in Transaction
        const leaveRequest = await prisma.$transaction(async (tx) => {
            const request = await tx.leaveRequest.create({
                data: {
                    userId: user.id,
                    leaveTypeId,
                    dateStart: new Date(dateStart),
                    dayPartStart: dayPartStart as DayPart,
                    dateEnd: new Date(dateEnd),
                    dayPartEnd: dayPartEnd as DayPart,
                    employeeComment,
                    status,
                    approverId,
                    decidedAt,
                }
            });

            if (!isAutoApproved && routingResult && routingResult.approvalSteps.length > 0) {
                await tx.approvalStep.createMany({
                    data: routingResult.approvalSteps.map(step => ({
                        ...step,
                        leaveId: request.id
                    }))
                });
            }

            return request;
        });

        // 6. Send Notifications
        if (!isAutoApproved && routingResult) {
            // Notify approvers
            for (const approver of routingResult.approvers) {
                await NotificationService.notify(
                    approver.id,
                    'LEAVE_SUBMITTED',
                    {
                        requesterName: `${user.name} ${user.lastname}`,
                        leaveType: leaveType.name,
                        startDate: dateStart,
                        endDate: dateEnd,
                        actionUrl: `/requests`
                    },
                    user.companyId
                );
            }
            
            // Notify watchers
            await WatcherService.notifyWatchers(leaveRequest.id, 'LEAVE_SUBMITTED');
        }

        return NextResponse.json({
            message: isAutoApproved ? 'Leave request auto-approved.' : 'Leave request submitted successfully.',
            leaveRequest,
            daysRequested: validation.daysRequested
        }, { status: 201 });

    } catch (error) {
        console.error('Error submitting leave request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requests = await prisma.leaveRequest.findMany({
            where: {
                userId: user.id,
                deletedAt: null
            },
            include: {
                leaveType: true,
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
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error('Error fetching leave requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
