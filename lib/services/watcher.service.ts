import prisma from '@/lib/prisma';
import { NotificationService } from './notification.service';
import { WorkflowFormValues } from '../validations/workflow';

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

    private static readonly ANY_MARKERS = new Set(['ANY', 'ALL', '*']);

    private static isAnyValue(value: string | null | undefined): boolean {
        if (!value) return false;
        return this.ANY_MARKERS.has(value.trim().toUpperCase());
    }

    /**
     * Identifies all watchers for a given leave request based on Workflow rules.
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

        const workflows = await prisma.workflow.findMany({
            where: {
                companyId: leaveRequest.user.companyId,
                isActive: true,
            },
            select: {
                id: true,
                rules: true,
            },
        });

        const watcherUserIds = new Set<string>();

        for (const workflow of workflows) {
            const rules = workflow.rules as WorkflowFormValues;
            const watchers = rules.watchers || [];
            
            const requestTypes = rules.requestTypes || [];
            const matchesRequestType = requestTypes.length === 0 ||
                requestTypes.some(rt => this.isAnyValue(rt) || requestTypeCandidates.includes(rt.toUpperCase()));
            if (!matchesRequestType) continue;

            const projectTypes = rules.projectTypes || [];
            const requestProjectTypes = new Set(
                leaveRequest.approvalSteps
                    .map((step) => step.project?.type)
                    .filter((value): value is string => Boolean(value))
                    .map((value) => value.trim().toUpperCase())
            );
            const requesterProjectTypes = new Set(
                leaveRequest.user.projects.map((p) => p.project.type.trim().toUpperCase())
            );
            
            const matchesProjectType = projectTypes.length === 0 ||
                projectTypes.some(pt => {
                    const upperPt = pt.toUpperCase();
                    if (this.isAnyValue(pt)) return true;
                    return requestProjectTypes.has(upperPt) || requesterProjectTypes.has(upperPt);
                });
            if (!matchesProjectType) continue;

            for (const watcher of watchers) {
                let resolvedUserIds: string[] = [];

                switch (watcher.resolver) {
                    case 'SPECIFIC_USER':
                        if (watcher.resolverId) {
                            resolvedUserIds = [watcher.resolverId];
                        }
                        break;
                    case 'ROLE':
                        if (watcher.resolverId) {
                            const roleUsers = await prisma.user.findMany({
                                where: {
                                    companyId: leaveRequest.user.companyId,
                                    activated: true,
                                    deletedAt: null,
                                },
                                select: { id: true },
                            });
                            resolvedUserIds = roleUsers.map(u => u.id);
                        }
                        break;
                    case 'DEPARTMENT_MANAGER':
                        if (leaveRequest.user.departmentId) {
                            const dept = await prisma.department.findUnique({
                                where: { id: leaveRequest.user.departmentId },
                                include: {
                                    supervisors: {
                                        include: { user: true }
                                    }
                                }
                            });
                            resolvedUserIds = dept?.supervisors.map(s => s.userId) || [];
                        }
                        break;
                    case 'LINE_MANAGER':
                        resolvedUserIds = [];
                        break;
                }

                for (const userId of resolvedUserIds) {
                    if (userId !== leaveRequest.userId) {
                        watcherUserIds.add(userId);
                    }
                }
            }
        }

        return Array.from(watcherUserIds);
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
