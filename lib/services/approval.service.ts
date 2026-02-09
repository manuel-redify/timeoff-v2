import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';

/**
 * Service for managing leave request approvals and delegations
 */
export class ApprovalService {
    /**
     * Get all pending approval requests for a user (including delegated requests)
     * @param userId - The ID of the user (approver or delegate)
     * @param companyId - The company ID for security filtering
     * @returns Array of pending leave requests with requester and leave type details
     */
    static async getPendingApprovals(userId: string, companyId: string) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Find active delegations where this user is the delegate
        const activeDelegations = await prisma.approvalDelegation.findMany({
            where: {
                delegateId: userId,
                isActive: true,
                startDate: { lte: today },
                endDate: { gte: today },
            },
            select: {
                supervisorId: true,
            },
        });

        const supervisorIds = activeDelegations.map((d: { supervisorId: string }) => d.supervisorId);
        const approverIds = [userId, ...supervisorIds];

        // Get all pending requests where the user (or their delegators) is an approver
        const pendingRequests = await prisma.leaveRequest.findMany({
            where: {
                status: 'NEW' as any,
                user: {
                    companyId,
                },
                approvalSteps: {
                    some: {
                        approverId: { in: approverIds },
                        status: 0, // Pending status
                    },
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                leaveType: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
                approvalSteps: {
                    where: {
                        approverId: { in: approverIds },
                        status: 0,
                    },
                    include: {
                        approver: {
                            select: {
                                id: true,
                                name: true,
                                lastname: true,
                            },
                        },
                        role: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        project: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                {
                    user: {
                        name: 'asc',
                    },
                },
                {
                    user: {
                        lastname: 'asc',
                    },
                },
                {
                    createdAt: 'asc',
                },
            ],
        });

        // Enrich with delegation context
        return pendingRequests.map((request) => {
            const approvalStep = request.approvalSteps[0];
            const isDelegated = approvalStep && supervisorIds.includes(approvalStep.approverId);

            return {
                ...request,
                isDelegated,
                originalApproverId: isDelegated ? approvalStep.approverId : null,
            };
        });
    }

    /**
     * Get count of pending approval requests for a user (including delegated requests)
     * @param userId - The ID of the user (approver or delegate)
     * @param companyId - The company ID for security filtering
     * @returns Number of pending approvals
     */
    static async getPendingApprovalsCount(userId: string, companyId: string): Promise<number> {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        // Find active delegations where this user is the delegate
        const activeDelegations = await prisma.approvalDelegation.findMany({
            where: {
                delegateId: userId,
                isActive: true,
                startDate: { lte: today },
                endDate: { gte: today },
            },
            select: {
                supervisorId: true,
            },
        });

        const supervisorIds = activeDelegations.map((d: { supervisorId: string }) => d.supervisorId);
        const approverIds = [userId, ...supervisorIds];

        // Get count of pending requests where the user (or their delegators) is an approver
        const count = await prisma.leaveRequest.count({
            where: {
                status: 'NEW' as any,
                user: {
                    companyId,
                },
                approvalSteps: {
                    some: {
                        approverId: { in: approverIds },
                        status: 0, // Pending status
                    },
                },
            },
        });

        return count;
    }

    /**
     * Get approval history for a user
     * @param userId - The ID of the user
     * @param companyId - The company ID for security filtering
     * @param limit - Maximum number of records to return
     */
    static async getApprovalHistory(
        userId: string,
        companyId: string,
        limit: number = 50
    ) {
        const approvedOrRejected = await prisma.leaveRequest.findMany({
            where: {
                approverId: userId,
                user: {
                    companyId,
                },
                status: {
                    in: ['APPROVED' as any, 'REJECTED' as any],
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
                leaveType: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    },
                },
            },
            orderBy: {
                decidedAt: 'desc',
            },
            take: limit,
        });

        return approvedOrRejected;
    }

    /**
     * Check if a user has active delegation for today
     * @param supervisorId - The supervisor's user ID
     */
    static async getActiveDelegation(supervisorId: string) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        return prisma.approvalDelegation.findFirst({
            where: {
                supervisorId,
                isActive: true,
                startDate: { lte: today },
                endDate: { gte: today },
            },
            include: {
                delegate: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Create a new approval delegation
     * @param supervisorId - The supervisor delegating authority
     * @param delegateId - The user receiving delegation
     * @param startDate - Start date of delegation
     * @param endDate - End date of delegation
     */
    static async createDelegation(
        supervisorId: string,
        delegateId: string,
        startDate: Date,
        endDate: Date
    ) {
        // Deactivate any overlapping delegations
        await prisma.approvalDelegation.updateMany({
            where: {
                supervisorId,
                isActive: true,
                OR: [
                    {
                        startDate: { lte: endDate },
                        endDate: { gte: startDate },
                    },
                ],
            },
            data: {
                isActive: false,
            },
        });

        // Create new delegation
        return prisma.approvalDelegation.create({
            data: {
                supervisorId,
                delegateId,
                startDate,
                endDate,
                isActive: true,
            },
            include: {
                delegate: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Get all delegations for a supervisor
     * @param supervisorId - The supervisor's user ID
     */
    static async getDelegations(supervisorId: string) {
        return prisma.approvalDelegation.findMany({
            where: {
                supervisorId,
            },
            include: {
                delegate: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                startDate: 'desc',
            },
        });
    }

    /**
     * Cancel/deactivate a delegation
     * @param delegationId - The delegation ID to cancel
     * @param supervisorId - The supervisor ID (for authorization)
     */
    static async cancelDelegation(delegationId: string, supervisorId: string) {
        return prisma.approvalDelegation.updateMany({
            where: {
                id: delegationId,
                supervisorId,
            },
            data: {
                isActive: false,
            },
        });
    }
}
