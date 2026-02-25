import prisma from '@/lib/prisma';
import { NotificationService } from './notification.service';
import { WorkflowResolverService } from './workflow-resolver-service';
import { WorkflowFormValues } from '../validations/workflow';

export class WatcherService {

    /**
     * Identifies all watchers for a given leave request based on Workflow rules.
     */
    static async getWatchersForRequest(leaveRequestId: string, projectId?: string): Promise<string[]> {
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveRequestId },
            include: {
                user: {
                    include: {
                        company: true,
                        department: true,
                        projects: {
                            where: {
                                project: { archived: false, status: 'ACTIVE' as any }
                            },
                            select: { projectId: true }
                        }
                    }
                },
                leaveType: true,
                approvalSteps: {
                    select: { projectId: true }
                }
            }
        });

        if (!leaveRequest) {
            return [];
        }

        // Resolve project context: explicit arg > approval step > user's project memberships (auto-approval fallback)
        let contextProjectIds: Array<string | null> = [];

        if (projectId) {
            contextProjectIds = [projectId];
        } else if (leaveRequest.approvalSteps.length > 0) {
            contextProjectIds = [leaveRequest.approvalSteps[0].projectId];
        } else {
            // Auto-approved requests have no approval steps — evaluate all user projects
            // so that project-scoped watcher policies (e.g. SAME_PROJECT) can resolve.
            const userProjectIds = leaveRequest.user.projects.map((p) => p.projectId);
            contextProjectIds = userProjectIds.length > 0 ? userProjectIds : [null];
        }

        const watcherUserIds = new Set<string>();

        for (const ctxProjectId of contextProjectIds) {
            const matchedPolicies = await WorkflowResolverService.findMatchingPolicies(
                leaveRequest.userId,
                ctxProjectId,
                'LEAVE_REQUEST',
                leaveRequest.leaveTypeId
            );

            if (matchedPolicies.length === 0) continue;

            const executionContext = {
                request: {
                    userId: leaveRequest.userId,
                    requestType: 'LEAVE_REQUEST',
                    projectId: ctxProjectId ?? undefined,
                    departmentId: leaveRequest.user.departmentId ?? undefined,
                    areaId: leaveRequest.user.areaId ?? undefined,
                },
                user: leaveRequest.user as any,
                company: {
                    id: leaveRequest.user.companyId,
                    roles: [],
                    departments: [],
                    projects: [],
                    contractTypes: [],
                }
            };

            for (const policy of matchedPolicies) {
                for (const watcher of policy.watchers) {
                    const resolvedIds = await WorkflowResolverService.resolveWatcher(
                        watcher,
                        executionContext
                    );
                    for (const id of resolvedIds) {
                        if (id !== leaveRequest.userId) {
                            watcherUserIds.add(id);
                        }
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
            projectId?: string;
        }
    ): Promise<void> {
        const watcherIds = await this.getWatchersForRequest(leaveRequestId, metadata?.projectId);

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
