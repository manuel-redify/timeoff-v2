import prisma from '@/lib/prisma';
import { NotificationService } from './notification.service';

export class WatcherService {
    static async getWatchersForRequest(leaveRequestId: string): Promise<string[]> {
        // Get the leave request with all necessary relationships
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                user: {
                    include: {
                        company: true,
                        teams: true
                    }
                },
                leaveType: true
            }
        });

        if (!leaveRequest) {
            return [];
        }

        // Find all watcher rules that match this request
        const watcherRules = await prisma.watcherRule.findMany({
            where: {
                companyId: leaveRequest.user.companyId,
                OR: [
                    // Match by leave type
                    { requestType: leaveRequest.leaveType.name },
                    // Match by generic leave request
                    { requestType: 'LEAVE_REQUEST' },
                    // Match all requests
                    { requestType: 'ALL' }
                ]
            }
        });

        const watcherUserIds: string[] = [];

        for (const rule of watcherRules) {
            // Check team scope if required
            if (rule.teamScopeRequired && rule.teamId) {
                const userInTeam = leaveRequest.user.teams.some(team => team.id === rule.teamId);
                if (!userInTeam) {
                    continue;
                }
            }

            // Check contract type if specified
            if (rule.contractType && leaveRequest.user.contractType !== rule.contractType) {
                continue;
            }

            // Find users who match this rule
            let users: { id: string }[] = [];

            if (rule.roleId) {
                // Get users with this role in the company via UserRoleArea
                const userRoleAreas = await prisma.userRoleArea.findMany({
                    where: {
                        roleId: rule.roleId,
                        user: {
                            companyId: leaveRequest.user.companyId
                        }
                    },
                    include: {
                        user: {
                            select: { id: true }
                        }
                    }
                });
                users = userRoleAreas.map(ura => ura.user);
            } else if (rule.teamId) {
                // Get users in this team
                const teamWithUsers = await prisma.team.findUnique({
                    where: { id: rule.teamId },
                    include: {
                        users: {
                            where: {
                                companyId: leaveRequest.user.companyId
                            },
                            select: { id: true }
                        }
                    }
                });
                users = teamWithUsers?.users || [];
            } else if (rule.projectId) {
                // Get users assigned to this project via UserProject
                const userProjects = await prisma.userProject.findMany({
                    where: {
                        projectId: rule.projectId,
                        user: {
                            companyId: leaveRequest.user.companyId
                        }
                    },
                    include: {
                        user: {
                            select: { id: true }
                        }
                    }
                });
                users = userProjects.map(up => up.user);
            }

            // Add matching users (excluding the requester)
            const userIds = users
                .map(u => u.id)
                .filter(id => id !== leaveRequest.userId);

            watcherUserIds.push(...userIds);
        }

        // Remove duplicates
        return [...new Set(watcherUserIds)];
    }

    static async notifyWatchers(
        leaveRequestId: string,
        type: 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED'
    ): Promise<void> {
        const watcherIds = await this.getWatchersForRequest(leaveRequestId);

        if (watcherIds.length === 0) {
            return;
        }

        // Get leave request details for notification
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                user: {
                    include: { company: true }
                },
                leaveType: true
            }
        });

        if (!leaveRequest) {
            return;
        }

        // Prepare notification data based on type
        const notificationData = {
            requesterName: `${leaveRequest.user.name} ${leaveRequest.user.lastname}`,
            leaveType: leaveRequest.leaveType.name,
            startDate: leaveRequest.dateStart.toISOString().split('T')[0],
            endDate: leaveRequest.dateEnd.toISOString().split('T')[0],
            actionUrl: `/requests`
        };

        // Notify all watchers
        for (const watcherId of watcherIds) {
            await NotificationService.notify(
                watcherId,
                type,
                notificationData,
                leaveRequest.user.companyId
            );
        }
    }
}