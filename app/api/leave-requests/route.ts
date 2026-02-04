import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { LeaveValidationService } from '@/lib/leave-validation-service';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { DayPart, LeaveStatus } from '@/lib/generated/prisma/enums';
import { requireAuth, handleAuthError } from '@/lib/api-auth';

export async function POST(request: Request) {
    try {
        const user = await requireAuth();

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

// Fetch user with contract type relationship to check contractor status
        const userWithContractType = await prisma.user.findUnique({
            where: { id: user.id },
            include: { contractType: true }
        });

        const isAutoApproved =
            user.isAutoApprove ||
            leaveType.autoApprove ||
            userWithContractType?.contractType?.name === 'Contractor';

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

        // 6. Send Notifications Asynchronously
        if (!isAutoApproved && routingResult) {
            // Send notifications asynchronously to avoid blocking response
            Promise.resolve().then(async () => {
                try {
                    console.log(`[LEAVE_NOTIFICATION] Processing notifications for request ${leaveRequest.id}`);
                    
                    // Notify all approvers in parallel
                    const notificationPromises = routingResult.approvers.map(approver => 
                        NotificationService.notify(
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
                        )
                    );

                    // Notify watchers in parallel with approvers
                    const watcherPromise = WatcherService.notifyWatchers(leaveRequest.id, 'LEAVE_SUBMITTED');

                    await Promise.all([...notificationPromises, watcherPromise]);
                    console.log(`[LEAVE_NOTIFICATION] Successfully sent notifications for request ${leaveRequest.id}`);
                } catch (notificationError) {
                    console.error('[LEAVE_NOTIFICATION] Failed to send notifications:', notificationError);
                }
            }).catch(error => {
                console.error('[LEAVE_NOTIFICATION] Unhandled error in async notification:', error);
            });
        }

        // 7. Send Approval Notification for Auto-Approved Requests
        if (isAutoApproved) {
            console.log(`[AUTO_APPROVAL] Sending approval notification to user ${user.id} for auto-approved request ${leaveRequest.id}`);
            Promise.resolve().then(async () => {
                try {
                    await NotificationService.notify(
                        user.id,
                        'LEAVE_APPROVED',
                        {
                            requesterName: `${user.name} ${user.lastname}`,
                            approverName: 'System',
                            leaveType: leaveType.name,
                            startDate: dateStart,
                            endDate: dateEnd,
                            actionUrl: `/requests/${leaveRequest.id}`
                        },
                        user.companyId
                    );
                    console.log(`[AUTO_APPROVAL] Successfully sent notification for request ${leaveRequest.id}`);
                } catch (notificationError) {
                    console.error('[AUTO_APPROVAL] Failed to send notification:', notificationError);
                }
            }).catch(error => {
                console.error('[AUTO_APPROVAL] Unhandled error in async notification:', error);
            });
        }

return NextResponse.json({
            message: isAutoApproved ? 'Leave request auto-approved.' : 'Leave request submitted successfully.',
            leaveRequest,
            daysRequested: validation.daysRequested
        }, { status: 201 });

    } catch (error) {
        return handleAuthError(error);
    }
}

export async function GET() {
    try {
        const user = await requireAuth();

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
        return handleAuthError(error);
    }
}
