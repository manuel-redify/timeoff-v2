import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';

export interface ConflictingLeave {
    id: string;
    userId: string;
    userName: string;
    dateStart: Date;
    dateEnd: Date;
    leaveTypeName: string;
    leaveTypeColor: string;
}

export interface ConflictDetectionResult {
    hasConflicts: boolean;
    conflictingLeaves: ConflictingLeave[];
    totalConflicts: number;
    message?: string;
}

/**
 * Utility for detecting overlapping approved leaves
 */
export class ConflictDetectionService {
    /**
     * Find overlapping approved leaves for a given date range and department/team
     * @param dateStart - Start date of the leave request
     * @param dateEnd - End date of the leave request
     * @param departmentId - Department ID to check conflicts within
     * @param excludeUserId - User ID to exclude from conflict check (the requester)
     * @param companyId - Company ID for security filtering
     */
    static async detectDepartmentConflicts(
        dateStart: Date,
        dateEnd: Date,
        departmentId: string | null,
        excludeUserId: string,
        companyId: string
    ): Promise<ConflictDetectionResult> {
        if (!departmentId) {
            return {
                hasConflicts: false,
                conflictingLeaves: [],
                totalConflicts: 0,
                message: 'No department assigned',
            };
        }

        // Find all approved leaves in the same department that overlap with the requested dates
        const conflictingLeaves = await prisma.leaveRequest.findMany({
            where: {
                status: LeaveStatus.APPROVED,
                userId: { not: excludeUserId },
                user: {
                    companyId,
                    departmentId,
                },
                OR: [
                    {
                        // Leave starts during the requested period
                        dateStart: {
                            gt: dateStart,
                            lt: dateEnd,
                        },
                    },
                    {
                        // Leave ends during the requested period
                        dateEnd: {
                            gt: dateStart,
                            lt: dateEnd,
                        },
                    },
                    {
                        // Leave completely encompasses the requested period
                        dateStart: { lt: dateStart },
                        dateEnd: { gt: dateEnd },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                    },
                },
                leaveType: {
                    select: {
                        name: true,
                        color: true,
                    },
                },
            },
            orderBy: {
                dateStart: 'asc',
            },
        });

        const conflicts: ConflictingLeave[] = conflictingLeaves.map((leave) => ({
            id: leave.id,
            userId: leave.user.id,
            userName: `${leave.user.name} ${leave.user.lastname}`,
            dateStart: leave.dateStart,
            dateEnd: leave.dateEnd,
            leaveTypeName: leave.leaveType.name,
            leaveTypeColor: leave.leaveType.color,
        }));

        return {
            hasConflicts: conflicts.length > 0,
            conflictingLeaves: conflicts,
            totalConflicts: conflicts.length,
            message:
                conflicts.length > 0
                    ? `${conflicts.length} team member(s) will be off during this period`
                    : 'No conflicts detected',
        };
    }

    /**
     * Find overlapping approved leaves for a specific team
     * @param dateStart - Start date of the leave request
     * @param dateEnd - End date of the leave request
     * @param teamIds - Array of team IDs to check conflicts within
     * @param excludeUserId - User ID to exclude from conflict check
     * @param companyId - Company ID for security filtering
     */
    static async detectTeamConflicts(
        dateStart: Date,
        dateEnd: Date,
        teamIds: string[],
        excludeUserId: string,
        companyId: string
    ): Promise<ConflictDetectionResult> {
        if (!teamIds || teamIds.length === 0) {
            return {
                hasConflicts: false,
                conflictingLeaves: [],
                totalConflicts: 0,
                message: 'No teams assigned',
            };
        }

        // Find all approved leaves in the same department that overlap with the requested dates
        const conflictingLeaves = await prisma.leaveRequest.findMany({
            where: {
                status: LeaveStatus.APPROVED,
                userId: { not: excludeUserId },
                user: {
                    companyId,
                    teams: {
                        some: {
                            id: { in: teamIds },
                        },
                    },
                },
                OR: [
                    {
                        dateStart: {
                            gt: dateStart,
                            lt: dateEnd,
                        },
                    },
                    {
                        dateEnd: {
                            gt: dateStart,
                            lt: dateEnd,
                        },
                    },
                    {
                        dateStart: { lt: dateStart },
                        dateEnd: { gt: dateEnd },
                    },
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                    },
                },
                leaveType: {
                    select: {
                        name: true,
                        color: true,
                    },
                },
            },
            orderBy: {
                dateStart: 'asc',
            },
        });

        const conflicts: ConflictingLeave[] = conflictingLeaves.map((leave) => ({
            id: leave.id,
            userId: leave.user.id,
            userName: `${leave.user.name} ${leave.user.lastname}`,
            dateStart: leave.dateStart,
            dateEnd: leave.dateEnd,
            leaveTypeName: leave.leaveType.name,
            leaveTypeColor: leave.leaveType.color,
        }));

        return {
            hasConflicts: conflicts.length > 0,
            conflictingLeaves: conflicts,
            totalConflicts: conflicts.length,
            message:
                conflicts.length > 0
                    ? `${conflicts.length} team member(s) will be off during this period`
                    : 'No conflicts detected',
        };
    }

    /**
     * Get comprehensive conflict information for a leave request
     * @param leaveRequestId - The leave request ID to check
     */
    static async getConflictsForRequest(
        leaveRequestId: string
    ): Promise<ConflictDetectionResult> {
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                user: {
                    select: {
                        id: true,
                        companyId: true,
                        departmentId: true,
                        teams: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        if (!leaveRequest) {
            return {
                hasConflicts: false,
                conflictingLeaves: [],
                totalConflicts: 0,
                message: 'Leave request not found',
            };
        }

        // Check department conflicts
        const departmentConflicts = await this.detectDepartmentConflicts(
            leaveRequest.dateStart,
            leaveRequest.dateEnd,
            leaveRequest.user.departmentId,
            leaveRequest.user.id,
            leaveRequest.user.companyId
        );

        // Check team conflicts
        const teamIds = leaveRequest.user.teams.map((t) => t.id);
        const teamConflicts = await this.detectTeamConflicts(
            leaveRequest.dateStart,
            leaveRequest.dateEnd,
            teamIds,
            leaveRequest.user.id,
            leaveRequest.user.companyId
        );

        // Combine and deduplicate conflicts
        const allConflicts = [
            ...departmentConflicts.conflictingLeaves,
            ...teamConflicts.conflictingLeaves,
        ];

        const uniqueConflicts = Array.from(
            new Map(allConflicts.map((c) => [c.id, c])).values()
        );

        return {
            hasConflicts: uniqueConflicts.length > 0,
            conflictingLeaves: uniqueConflicts,
            totalConflicts: uniqueConflicts.length,
            message:
                uniqueConflicts.length > 0
                    ? `${uniqueConflicts.length} colleague(s) will be off during this period`
                    : 'No conflicts detected',
        };
    }
}
