import prisma from '../prisma';
import { 
    ResolverType, 
    ContextScope, 
    WorkflowStep, 
    WorkflowWatcher, 
    WorkflowTrigger, 
    WorkflowPolicy, 
    WorkflowExecutionContext,
    WorkflowResolution 
} from '../types/workflow';
import { User, Role, Department, Project, ApprovalRule, WatcherRule } from '../generated/prisma/client';

export class WorkflowResolverService {
    
    /**
     * Find all matching policies for a given request context
     * Aggregates rules from ApprovalRule based on Multi-Role logic (UNION)
     */
    static async findMatchingPolicies(
        userId: string, 
        projectId: string | null, 
        requestType: string
    ): Promise<WorkflowPolicy[]> {
        // Get user context
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: true,
                department: {
                    include: {
                        supervisors: {
                            include: { user: true }
                        }
                    }
                },
                defaultRole: true,
                area: true
            }
        });

        if (!user) throw new Error('User not found');

        // Get project context if provided
        let project: Project | null = null;
        let userProjectRole: Role | null = null;

        if (projectId) {
            project = await prisma.project.findUnique({
                where: { id: projectId }
            });

            if (project) {
                const userProject = await prisma.userProject.findFirst({
                    where: { userId: user.id, projectId: project.id },
                    include: { role: true }
                });
                userProjectRole = userProject?.role || user.defaultRole;
            }
        }

        // Get user's effective role (project role or default role)
        const effectiveRole = userProjectRole || user.defaultRole;
        if (!effectiveRole) return [];

        // Find all matching approval rules
        const approvalRules = await prisma.approvalRule.findMany({
            where: {
                companyId: user.companyId,
                requestType: requestType,
                subjectRoleId: effectiveRole.id,
                OR: [
                    { subjectAreaId: null },
                    { subjectAreaId: user.areaId }
                ]
            },
            include: {
                approverRole: true,
                subjectRole: true,
                subjectArea: true
            },
            orderBy: { sequenceOrder: 'asc' }
        });

        // Filter by project type
        const filteredRules = approvalRules.filter(rule => {
            if (!project) return rule.projectType === null;
            return rule.projectType === null || rule.projectType === project.type;
        });

        // Group rules into policies by trigger fields
        const policyMap = new Map<string, {
            trigger: WorkflowTrigger;
            rules: ApprovalRule[];
            watchers: WatcherRule[];
        }>();

        for (const rule of filteredRules) {
            const triggerKey = this.generateTriggerKey(user.companyId, requestType, project?.type, effectiveRole.id, user.areaId || undefined);
            
            if (!policyMap.has(triggerKey)) {
                const trigger: WorkflowTrigger = {
                    requestType: rule.requestType,
                    contractType: user.contractTypeId || undefined,
                    role: effectiveRole.name,
                    department: user.department?.name,
                    projectType: project?.type || undefined,
                };

                policyMap.set(triggerKey, {
                    trigger,
                    rules: [],
                    watchers: []
                });
            }

            policyMap.get(triggerKey)!.rules.push(rule);
        }

        // Find matching watcher rules for each policy
        for (const [triggerKey, policy] of Array.from(policyMap.entries())) {
            const watcherRules = await prisma.watcherRule.findMany({
                where: {
                    companyId: user.companyId,
                    OR: [
                        { requestType: requestType },
                        { requestType: 'LEAVE_REQUEST' },
                        { requestType: 'ALL' }
                    ],
                    ...(project?.type ? [{ projectType: project.type }] : []),
                },
                include: {
                    role: true,
                    team: true,
                    project: true,
                    contractType: true
                }
            });

            policy.watchers = watcherRules;
        }

        // Convert to WorkflowPolicy format
        const policies: WorkflowPolicy[] = [];
        for (const [triggerKey, policyData] of Array.from(policyMap.entries())) {
            // Convert approval rules to workflow steps
            const steps: WorkflowStep[] = policyData.rules.map((rule, index) => ({
                sequence: rule.sequenceOrder || index + 1,
                resolver: this.mapApprovalRuleToResolverType(rule.approverRoleId ? 'ROLE' : 'DEPARTMENT_MANAGER'),
                resolverId: rule.approverRoleId,
                scope: this.mapAreaConstraintToScope(rule.approverAreaConstraint),
                action: 'APPROVE'
            }));

            // Convert watcher rules to workflow watchers
            const watchers: WorkflowWatcher[] = policyData.watchers.map(rule => ({
                resolver: this.mapWatcherRuleToResolverType(rule),
                resolverId: this.getWatcherResolverId(rule),
                scope: ContextScope.GLOBAL
            }));

            const policy: WorkflowPolicy = {
                id: triggerKey,
                name: this.generatePolicyName(policyData.trigger),
                trigger: policyData.trigger,
                steps,
                watchers,
                isActive: true,
                companyId: user.companyId,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            policies.push(policy);
        }

        return policies;
    }

    /**
     * Resolve a workflow step to concrete user IDs
     */
    static async resolveStep(
        step: WorkflowStep, 
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        let resolvers: string[] = [];

        switch (step.resolver) {
            case ResolverType.SPECIFIC_USER:
                if (step.resolverId) {
                    resolvers = [step.resolverId];
                }
                break;

            case ResolverType.ROLE:
                if (step.resolverId) {
                    resolvers = await this.resolveUsersByRole(
                        step.resolverId, 
                        context, 
                        step.scope
                    );
                }
                break;

            case ResolverType.DEPARTMENT_MANAGER:
                resolvers = await this.resolveDepartmentManagers(context);
                break;

            case ResolverType.LINE_MANAGER:
                resolvers = await this.resolveLineManagers(context);
                break;
        }

        // Apply scope filtering
        resolvers = this.applyScope(resolvers, step.scope, context);

        // Exclude the requester
        return resolvers.filter(id => id !== context.request.userId);
    }

    /**
     * Resolve Line Manager and Department Manager resolver types
     */
    private static async resolveDepartmentManagers(
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        const { request } = context;
        
        if (!request.departmentId) return [];

        // Get department supervisors
        const supervisors = await prisma.departmentSupervisor.findMany({
            where: { departmentId: request.departmentId },
            include: { user: true }
        });

        // Get department boss if exists
        const department = await prisma.department.findUnique({
            where: { id: request.departmentId },
            include: { boss: true }
        });

        const managerIds = [
            ...supervisors.map(s => s.userId),
            ...(department?.bossId ? [department.bossId] : [])
        ];

        // Filter to active users
        const activeManagers = await prisma.user.findMany({
            where: {
                id: { in: managerIds },
                activated: true,
                deletedAt: null
            },
            select: { id: true }
        });

        return activeManagers.map(u => u.id);
    }

    private static async resolveLineManagers(
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        // For now, line managers are the same as department managers
        // In future, this could be extended for more complex hierarchies
        return this.resolveDepartmentManagers(context);
    }

    /**
     * Resolve users by role with scope filtering
     */
    private static async resolveUsersByRole(
        roleId: string,
        context: WorkflowExecutionContext,
        scope: ContextScope
    ): Promise<string[]> {
        const { request } = context;

        let whereClause: any = {
            roleId,
            user: {
                companyId: context.company.id,
                activated: true,
                deletedAt: null
            }
        };

        // Apply project scope if needed
        if (scope === ContextScope.SAME_PROJECT && request.projectId) {
            whereClause.projectId = request.projectId;
        }

        const userProjects = await prisma.userProject.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { id: true, areaId: true, departmentId: true }
                }
            }
        });

        let userIds = userProjects.map(up => up.userId);

        // Apply additional scope filtering
        if (scope === ContextScope.SAME_AREA && request.areaId) {
            const sameAreaUsers = userProjects.filter(
                up => up.user.areaId === request.areaId
            );
            userIds = sameAreaUsers.map(up => up.userId);
        }

        if (scope === ContextScope.SAME_DEPARTMENT && request.departmentId) {
            const sameDeptUsers = userProjects.filter(
                up => up.user.departmentId === request.departmentId
            );
            userIds = sameDeptUsers.map(up => up.userId);
        }

        return Array.from(new Set(userIds)); // Remove duplicates
    }

    /**
     * Apply scope constraints to potential approvers
     */
    static applyScope(
        potentialApprovers: string[], 
        scope: ContextScope, 
        context: WorkflowExecutionContext
    ): string[] {
        // Global scope doesn't filter
        if (scope === ContextScope.GLOBAL) {
            return potentialApprovers;
        }

        // For other scopes, we need to check user details
        // This is a simplified implementation - in practice, you'd want to batch these queries
        return potentialApprovers; // Placeholder - actual implementation would filter by scope
    }

    /**
     * Generate parallel sub-flows for each matched policy/role combination
     */
    static async generateSubFlows(
        policies: WorkflowPolicy[],
        context: WorkflowExecutionContext
    ): Promise<WorkflowResolution> {
        const resolution: WorkflowResolution = {
            resolvers: [],
            watchers: []
        };

        for (const policy of policies) {
            // Process each step in the policy
            for (const step of policy.steps) {
                const stepResolverIds = await this.resolveStep(step, context);
                
                for (const resolverId of stepResolverIds) {
                    resolution.resolvers.push({
                        userId: resolverId,
                        type: step.resolver,
                        step: step.sequence
                    });
                }
            }

            // Process watchers
            for (const watcher of policy.watchers) {
                const watcherIds = await this.resolveWatcher(watcher, context);
                
                for (const watcherId of watcherIds) {
                    resolution.watchers.push({
                        userId: watcherId,
                        type: watcher.resolver
                    });
                }
            }
        }

        // Remove duplicates
        resolution.resolvers = this.deduplicateResolvers(resolution.resolvers);
        resolution.watchers = this.deduplicateResolvers(resolution.watchers);

        return resolution;
    }

    private static async resolveWatcher(
        watcher: WorkflowWatcher,
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        switch (watcher.resolver) {
            case ResolverType.SPECIFIC_USER:
                return watcher.resolverId ? [watcher.resolverId] : [];

            case ResolverType.ROLE:
                if (watcher.resolverId) {
                    // Get users with this role as default role
                    const users = await prisma.user.findMany({
                        where: {
                            defaultRoleId: watcher.resolverId,
                            companyId: context.company.id,
                            activated: true,
                            deletedAt: null
                        },
                        select: { id: true }
                    });
                    return users.map(u => u.id);
                }
                return [];

            default:
                return [];
        }
    }

    // Helper methods
    private static generateTriggerKey(
        companyId: string,
        requestType: string,
        projectType: string | undefined,
        subjectRoleId: string | undefined,
        subjectAreaId: string | undefined
    ): string {
        return `${companyId}:${requestType}:${projectType || 'null'}:${subjectRoleId || 'null'}:${subjectAreaId || 'null'}`;
    }

    private static generatePolicyName(trigger: WorkflowTrigger): string {
        const parts = [trigger.requestType];
        if (trigger.role) parts.push(`for ${trigger.role}`);
        if (trigger.projectType) parts.push(`in ${trigger.projectType}`);
        if (trigger.department) parts.push(`in ${trigger.department}`);
        return parts.join(' ');
    }

    private static mapApprovalRuleToResolverType(approverRoleId: string | null): ResolverType {
        return approverRoleId ? ResolverType.ROLE : ResolverType.DEPARTMENT_MANAGER;
    }

    private static mapAreaConstraintToScope(constraint: string | null): ContextScope {
        switch (constraint) {
            case 'SAME_AS_SUBJECT':
                return ContextScope.SAME_AREA;
            default:
                return ContextScope.GLOBAL;
        }
    }

    private static mapWatcherRuleToResolverType(rule: any): ResolverType {
        if (rule.roleId) return ResolverType.ROLE;
        if (rule.projectId) return ResolverType.ROLE;
        if (rule.teamId) return ResolverType.ROLE;
        return ResolverType.SPECIFIC_USER;
    }

    private static getWatcherResolverId(rule: any): string | undefined {
        return rule.roleId || rule.projectId || rule.teamId;
    }

    private static deduplicateResolvers(resolvers: Array<{ userId: string; type: ResolverType; step?: number }>): Array<{ userId: string; type: ResolverType; step?: number }> {
        const seen = new Map<string, { userId: string; type: ResolverType; step?: number }>();
        
        for (const resolver of resolvers) {
            const key = resolver.userId;
            if (!seen.has(key) || (resolver.step && (!seen.get(key)!.step || resolver.step < seen.get(key)!.step!))) {
                seen.set(key, resolver);
            }
        }
        
        return Array.from(seen.values());
    }
}