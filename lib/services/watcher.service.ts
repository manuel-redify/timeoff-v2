import prisma from '@/lib/prisma';
import { NotificationService } from './notification.service';

export class WatcherService {
    private static getRequestTypeCandidates(leaveTypeName: string): string[] {
        const base = (leaveTypeName || '').trim();
        const candidates = new Set<string>([
            base,
            base.toUpperCase(),
            'LEAVE_REQUEST',
            'LEAVE',
            'ALL',
            'ANY',
            '*',
        ]);

        if (base.toUpperCase() === 'LEAVE') {
            candidates.add('LEAVE_REQUEST');
        }

        if (base.toUpperCase() === 'LEAVE_REQUEST') {
            candidates.add('LEAVE');
        }

        return Array.from(candidates).filter(Boolean);
    }

    /**
     * Identifies all watchers for a given leave request based on WatcherRules.
     */
    static async getWatchersForRequest(leaveRequestId: string): Promise<string[]> {
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                approvalSteps: {
                    select: {
                        projectId: true,
                        project: {
                            select: {
                                type: true,
                            },
                        },
                    },
                },
                user: {
                    include: {
                        company: true,
                        teams: true,
                        projects: {
                            include: {
                                project: true
                            }
                        }
                    }
                },
                leaveType: true
            }
        });

        if (!leaveRequest) {
            return [];
        }

        const requestTypeCandidates = this.getRequestTypeCandidates(leaveRequest.leaveType.name)
            .map((value) => value.toUpperCase());

        const watcherRules = await prisma.watcherRule.findMany({
            where: {
                companyId: leaveRequest.user.companyId,
            }
        });

        const requestProjectIds = new Set(
            leaveRequest.approvalSteps
                .map((step) => step.projectId)
                .filter((id): id is string => Boolean(id))
        );
        const requestProjectTypes = new Set(
            leaveRequest.approvalSteps
                .map((step) => step.project?.type)
                .filter((value): value is string => Boolean(value))
                .map((value) => value.trim().toUpperCase())
        );
        const requesterProjectTypes = new Set(
            leaveRequest.user.projects.map((project) => project.project.type.trim().toUpperCase())
        );

        const watcherUserIds = new Set<string>();

        for (const rule of watcherRules) {
            const normalizedRuleRequestType = (rule.requestType || '').trim().toUpperCase();
            if (!requestTypeCandidates.includes(normalizedRuleRequestType)) {
                continue;
            }

            // Check project type if specified
            const normalizedRuleProjectType = rule.projectType?.trim().toUpperCase();
            if (normalizedRuleProjectType && !['ANY', 'ALL', '*'].includes(normalizedRuleProjectType.toUpperCase())) {
                const hasMatchingProjectType =
                    requestProjectTypes.has(normalizedRuleProjectType) ||
                    requesterProjectTypes.has(normalizedRuleProjectType);
                if (!hasMatchingProjectType) {
                    continue;
                }
            }

            // Check team scope if required
            if (rule.teamScopeRequired && rule.teamId) {
                const userInTeam = leaveRequest.user.teams.some(team => team.id === rule.teamId);
                if (!userInTeam) {
                    continue;
                }
            }

            // Check contract type if specified
            if (rule.contractTypeId && !['ANY', 'ALL'].includes(rule.contractTypeId as string)) {
                if (leaveRequest.user.contractTypeId !== rule.contractTypeId) {
                    continue;
                }
            }

            // Check project specific match
            if (rule.projectId) {
                const isAssignedToProject =
                    requestProjectIds.has(rule.projectId) ||
                    leaveRequest.user.projects.some(up => up.projectId === rule.projectId);
                if (!isAssignedToProject) {
                    continue;
                }
            }

            // Find users who match this rule's target
            let targetUsers: { id: string }[] = [];

            if (rule.roleId) {
                const usersByDefaultRole = await prisma.user.findMany({
                    where: {
                        defaultRoleId: rule.roleId,
                        companyId: leaveRequest.user.companyId,
                        activated: true,
                        deletedAt: null
                    },
                    select: { id: true }
                });

                const usersByProjectRole = await prisma.userProject.findMany({
                    where: {
                        roleId: rule.roleId,
                        user: {
                            companyId: leaveRequest.user.companyId,
                            activated: true,
                            deletedAt: null,
                        },
                    },
                    select: {
                        userId: true,
                    },
                });

                targetUsers = Array.from(
                    new Set([
                        ...usersByDefaultRole.map((user) => user.id),
                        ...usersByProjectRole.map((userProject) => userProject.userId),
                    ])
                ).map((id) => ({ id }));
            } else if (rule.teamId) {
                const teamWithUsers = await prisma.team.findUnique({
                    where: { id: rule.teamId },
                    include: {
                        users: {
                            where: { companyId: leaveRequest.user.companyId, activated: true, deletedAt: null },
                            select: { id: true }
                        }
                    }
                });
                targetUsers = teamWithUsers?.users || [];
            } else if (rule.projectId) {
                const userProjects = await prisma.userProject.findMany({
                    where: {
                        projectId: rule.projectId,
                        user: { companyId: leaveRequest.user.companyId, activated: true, deletedAt: null }
                    },
                    select: { userId: true }
                });
                targetUsers = userProjects.map(up => ({ id: up.userId }));
            }

            for (const u of targetUsers) {
                if (u.id !== leaveRequest.userId) {
                    watcherUserIds.add(u.id);
                }
            }
        }

        // Fallback to workflow-builder policies stored in comments, when no DB watcher rule matched.
        if (watcherUserIds.size === 0) {
            const workflowWatcherIds = await this.resolveWorkflowPolicyWatchers(
                leaveRequest.user.companyId,
                leaveRequest.user.id,
                leaveRequest.user.departmentId,
                leaveRequest.leaveTypeId,
                requestTypeCandidates
            );

            for (const watcherId of workflowWatcherIds) {
                watcherUserIds.add(watcherId);
            }
        }

        return Array.from(watcherUserIds);
    }

    private static async resolveWorkflowPolicyWatchers(
        companyId: string,
        requesterId: string,
        requesterDepartmentId: string | null,
        leaveTypeId: string,
        requestTypeCandidates: string[]
    ): Promise<string[]> {
        const policies = await prisma.comment.findMany({
            where: {
                companyId,
                entityType: 'WORKFLOW_POLICY',
            },
            select: {
                comment: true,
            },
        });

        const watcherIds = new Set<string>();

        for (const policy of policies) {
            let payload: {
                isActive?: boolean;
                requestTypes?: string[];
                watchers?: Array<{ resolver?: string; resolverId?: string }>;
            };

            try {
                payload = JSON.parse(policy.comment);
            } catch {
                continue;
            }

            if (!payload.isActive) {
                continue;
            }

            const normalizedRequestTypes = new Set(
                (payload.requestTypes ?? []).map((value) => String(value).trim().toUpperCase())
            );
            const matchesRequestType =
                normalizedRequestTypes.has(leaveTypeId.toUpperCase()) ||
                requestTypeCandidates.some((candidate) =>
                    normalizedRequestTypes.has(candidate.toUpperCase())
                );

            if (!matchesRequestType) {
                continue;
            }

            for (const watcher of payload.watchers ?? []) {
                if (watcher.resolver === 'SPECIFIC_USER' && watcher.resolverId) {
                    if (watcher.resolverId !== requesterId) {
                        watcherIds.add(watcher.resolverId);
                    }
                    continue;
                }

                if (watcher.resolver === 'ROLE' && watcher.resolverId) {
                    const [usersByDefaultRole, usersByProjectRole] = await Promise.all([
                        prisma.user.findMany({
                            where: {
                                companyId,
                                activated: true,
                                deletedAt: null,
                                defaultRoleId: watcher.resolverId,
                                id: { not: requesterId },
                            },
                            select: { id: true },
                        }),
                        prisma.userProject.findMany({
                            where: {
                                roleId: watcher.resolverId,
                                user: {
                                    companyId,
                                    activated: true,
                                    deletedAt: null,
                                    id: { not: requesterId },
                                },
                            },
                            select: { userId: true },
                        }),
                    ]);

                    for (const user of usersByDefaultRole) {
                        watcherIds.add(user.id);
                    }
                    for (const userProject of usersByProjectRole) {
                        watcherIds.add(userProject.userId);
                    }
                    continue;
                }

                if (
                    (watcher.resolver === 'DEPARTMENT_MANAGER' || watcher.resolver === 'LINE_MANAGER') &&
                    requesterDepartmentId
                ) {
                    const [supervisors, department] = await Promise.all([
                        prisma.departmentSupervisor.findMany({
                            where: { departmentId: requesterDepartmentId },
                            select: { userId: true },
                        }),
                        prisma.department.findUnique({
                            where: { id: requesterDepartmentId },
                            select: { bossId: true },
                        }),
                    ]);

                    const managerIds = Array.from(
                        new Set([
                            ...supervisors.map((supervisor) => supervisor.userId),
                            ...(department?.bossId ? [department.bossId] : []),
                        ])
                    ).filter((id) => id !== requesterId);

                    if (managerIds.length === 0) {
                        continue;
                    }

                    const activeManagers = await prisma.user.findMany({
                        where: {
                            id: { in: managerIds },
                            companyId,
                            activated: true,
                            deletedAt: null,
                        },
                        select: { id: true },
                    });

                    for (const manager of activeManagers) {
                        watcherIds.add(manager.id);
                    }
                }
            }
        }

        return Array.from(watcherIds);
    }

    /**
     * Notifies watchers of a specific event.
     */
    static async notifyWatchers(
        leaveRequestId: string,
        type: 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED',
        metadata?: {
            approverName?: string;
            comment?: string;
        }
    ): Promise<void> {
        const watcherIds = await this.getWatchersForRequest(leaveRequestId);

        if (watcherIds.length === 0) {
            return;
        }

        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                approvalSteps: {
                    where: { status: 0 },
                    select: { approverId: true }
                },
                user: { include: { company: true } },
                leaveType: true
            }
        });

        if (!leaveRequest) {
            return;
        }

        const pendingApproverIds = new Set(leaveRequest.approvalSteps.map((step) => step.approverId));
        const filteredWatcherIds = watcherIds.filter((watcherId) => !pendingApproverIds.has(watcherId));
        if (filteredWatcherIds.length === 0) {
            return;
        }

        const notificationData: {
            requesterName: string;
            leaveType: string;
            startDate: string;
            endDate: string;
            approverName?: string;
            comment?: string;
        } = {
            requesterName: `${leaveRequest.user.name} ${leaveRequest.user.lastname}`,
            leaveType: leaveRequest.leaveType.name,
            startDate: leaveRequest.dateStart.toISOString().split('T')[0],
            endDate: leaveRequest.dateEnd.toISOString().split('T')[0],
        };

        // Include approver info and comment for rejection notifications
        if (type === 'LEAVE_REJECTED' && metadata) {
            notificationData.approverName = metadata.approverName;
            notificationData.comment = metadata.comment;
        }

        await Promise.all(
            filteredWatcherIds.map(watcherId =>
                    NotificationService.notify(
                        watcherId,
                        type,
                        notificationData,
                        leaveRequest.user.companyId
                    )
                )
            );
    }
}
