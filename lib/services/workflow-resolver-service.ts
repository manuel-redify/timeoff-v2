import prisma from '../prisma';
import {
    ResolverType,
    ContextScope,
    WorkflowStep,
    WorkflowWatcher,
    WorkflowTrigger,
    WorkflowPolicy,
    WorkflowExecutionContext,
    WorkflowResolution,
    WorkflowSubFlow,
    WorkflowSubFlowStep,
    WorkflowSubFlowStepGroup,
    WorkflowStepRuntimeState,
    WorkflowSubFlowRuntimeState,
    WorkflowMasterRuntimeState,
    WorkflowAggregateOutcome
} from '../types/workflow';
import { LeaveStatus } from '../generated/prisma/enums';
import { ProjectStatus, ApprovalRule, WatcherRule } from '../generated/prisma/client';

export class WorkflowResolverService {
    private static readonly ANY_MARKERS = new Set(['ANY', 'ALL', '*']);

    /**
     * Find all matching policies for a given request context
     * Aggregates rules from ApprovalRule based on Multi-Role logic (UNION)
     */
    static async findMatchingPolicies(
        userId: string,
        projectId: string | null,
        requestType: string
    ): Promise<WorkflowPolicy[]> {
        const now = new Date();
        const normalizedRequestType = requestType.trim();

        // Get active user context
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                activated: true,
                deletedAt: null
            },
            include: {
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

        // Get active project context if provided
        let project: { id: string; type: string } | null = null;

        if (projectId) {
            project = await prisma.project.findFirst({
                where: {
                    id: projectId,
                    companyId: user.companyId,
                    archived: false,
                    status: ProjectStatus.ACTIVE
                },
                select: {
                    id: true,
                    type: true
                }
            });

            if (!project) return [];
        }

        const effectiveRoles = await this.collectEffectiveRequesterRoles({
            userId: user.id,
            defaultRole: user.defaultRole
                ? {
                    id: user.defaultRole.id,
                    name: user.defaultRole.name
                }
                : null,
            projectId: project?.id ?? null,
            now
        });

        if (effectiveRoles.length === 0) return [];

        const effectiveRoleIds = effectiveRoles.map((role) => role.id);
        const effectiveRoleNames = effectiveRoles.map((role) => role.name);

        const requestTypeCandidates = this.getStringCandidates(normalizedRequestType);

        const subjectAreaClause = user.areaId
            ? [{ subjectAreaId: null }, { subjectAreaId: user.areaId }]
            : [{ subjectAreaId: null }];

        // Find all potentially matching approval rules (UNION), then filter deterministically in-memory.
        const approvalRules = await prisma.approvalRule.findMany({
            where: {
                companyId: user.companyId,
                requestType: { in: requestTypeCandidates },
                OR: [
                    { subjectRoleId: { in: effectiveRoleIds } },
                    {
                        subjectRole: {
                            name: {
                                in: ['ANY', 'ALL', '*'],
                                mode: 'insensitive'
                            }
                        }
                    }
                ]
            },
            include: {
                approverRole: true,
                subjectRole: true,
                subjectArea: true
            },
            orderBy: [
                { sequenceOrder: 'asc' },
                { id: 'asc' }
            ]
        });

        const filteredRules = approvalRules.filter((rule) => this.isApprovalRuleMatch({
            rule,
            requestType: normalizedRequestType,
            projectType: project?.type ?? null,
            requesterAreaId: user.areaId,
            effectiveRoleIds,
            subjectAreaClause
        }));

        if (filteredRules.length === 0) return [];

        // Find all potentially matching watcher rules once, then dedupe per policy.
        const watcherRules = await prisma.watcherRule.findMany({
            where: {
                companyId: user.companyId,
                requestType: { in: requestTypeCandidates }
            },
            include: {
                role: true,
                team: true,
                project: true,
                contractType: true
            },
            orderBy: { id: 'asc' }
        });

        const matchedWatcherRules = watcherRules.filter((rule) => this.isWatcherRuleMatch({
            rule,
            requestType: normalizedRequestType,
            projectType: project?.type ?? null,
            requesterContractTypeId: user.contractTypeId ?? null
        }));

        // Group rules into policies using deterministic trigger keys to avoid duplicates.
        const policyMap = new Map<string, {
            trigger: WorkflowTrigger;
            rules: ApprovalRule[];
            watchers: WatcherRule[];
            ruleIds: Set<string>;
            watcherIds: Set<string>;
        }>();

        for (const rule of filteredRules) {
            const triggerKey = this.generateTriggerKey(
                user.companyId,
                this.normalizeAnyValue(rule.requestType),
                this.normalizeAnyValue(rule.projectType),
                this.normalizeRuleRoleTrigger(rule, effectiveRoleIds, effectiveRoleNames),
                rule.subjectAreaId ?? undefined
            );

            if (!policyMap.has(triggerKey)) {
                const trigger: WorkflowTrigger = {
                    requestType: this.normalizeAnyValue(rule.requestType),
                    contractType: user.contractTypeId || undefined,
                    role: this.normalizeRuleRoleName(rule, effectiveRoleNames),
                    department: user.department?.name,
                    projectType: this.normalizeAnyValue(rule.projectType) || undefined,
                };

                policyMap.set(triggerKey, {
                    trigger,
                    rules: [],
                    watchers: [],
                    ruleIds: new Set<string>(),
                    watcherIds: new Set<string>()
                });
            }

            const policy = policyMap.get(triggerKey)!;
            if (!policy.ruleIds.has(rule.id)) {
                policy.rules.push(rule);
                policy.ruleIds.add(rule.id);
            }
        }

        for (const policyData of Array.from(policyMap.values())) {
            for (const watcherRule of matchedWatcherRules) {
                if (!policyData.watcherIds.has(watcherRule.id)) {
                    policyData.watchers.push(watcherRule);
                    policyData.watcherIds.add(watcherRule.id);
                }
            }
        }

        // Convert to WorkflowPolicy format
        const policies: WorkflowPolicy[] = [];
        for (const [triggerKey, policyData] of Array.from(policyMap.entries())) {
            // Convert approval rules to workflow steps
            const sortedRules = policyData.rules.sort((a, b) => {
                const left = a.sequenceOrder ?? Number.MAX_SAFE_INTEGER;
                const right = b.sequenceOrder ?? Number.MAX_SAFE_INTEGER;
                if (left !== right) return left - right;
                return a.id.localeCompare(b.id);
            });

            const steps: WorkflowStep[] = sortedRules.map((rule, index) => ({
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
        return this.applyScope(resolvers, step.scope, context);
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
     * Generate parallel sub-flows for each matched policy/role combination with safety logic
     */
    static async generateSubFlows(
        policies: WorkflowPolicy[],
        context: WorkflowExecutionContext
    ): Promise<WorkflowResolution> {
        const resolution: WorkflowResolution = {
            resolvers: [],
            watchers: [],
            subFlows: []
        };

        const sortedPolicies = [...policies].sort((a, b) => a.id.localeCompare(b.id));

        for (const policy of sortedPolicies) {
            const subFlow = await this.buildSubFlow(policy, context);
            resolution.subFlows.push(subFlow);

            for (const group of subFlow.stepGroups) {
                for (const step of group.steps) {
                    for (const resolverId of step.resolverIds) {
                        resolution.resolvers.push({
                            userId: resolverId,
                            type: step.resolver,
                            step: step.sequence
                        });
                    }
                }
            }

            for (const watcher of policy.watchers) {
                const watcherIds = await this.resolveWatcher(watcher, context);
                const validWatchers = watcherIds.filter((id) => !this.isSelfApproval(id, context.request.userId));

                for (const watcherId of validWatchers) {
                    resolution.watchers.push({
                        userId: watcherId,
                        type: watcher.resolver
                    });
                }
            }
        }

        // Ensure we always have at least one resolver as final safety net
        if (resolution.resolvers.length === 0) {
            const lastResortApprovers = await this.getCompanyAdminFallback(
                context.company.id,
                context.request.userId
            );

            for (const approverId of lastResortApprovers) {
                resolution.resolvers.push({
                    userId: approverId,
                    type: ResolverType.SPECIFIC_USER,
                    step: 999 // Emergency fallback step
                });
            }
        }

        resolution.subFlows = resolution.subFlows.map((subFlow) => ({
            ...subFlow,
            watcherUserIds: Array.from(
                new Set(
                    resolution.watchers
                        .map((watcher) => watcher.userId)
                )
            ).sort((a, b) => a.localeCompare(b))
        }));

        // Remove duplicates while preserving earliest step sequence.
        resolution.resolvers = this.deduplicateResolvers(resolution.resolvers);
        resolution.watchers = this.deduplicateResolvers(resolution.watchers);

        return resolution;
    }

    /**
     * Compute master workflow outcome from sub-flow runtime states.
     * REJECTED if any sub-flow rejects, APPROVED only when all required sub-flows are complete.
     */
    static aggregateOutcome(resolution: WorkflowResolution): WorkflowAggregateOutcome {
        const subFlowStates = resolution.subFlows.map((subFlow) => ({
            subFlowId: subFlow.id,
            state: this.getSubFlowRuntimeState(subFlow)
        }));

        const hasRejected = subFlowStates.some((entry) => entry.state === WorkflowSubFlowRuntimeState.REJECTED);
        if (hasRejected) {
            return {
                masterState: WorkflowMasterRuntimeState.REJECTED,
                leaveStatus: LeaveStatus.REJECTED,
                subFlowStates
            };
        }

        const allApproved =
            subFlowStates.length > 0 &&
            subFlowStates.every((entry) => entry.state === WorkflowSubFlowRuntimeState.APPROVED);

        if (allApproved) {
            return {
                masterState: WorkflowMasterRuntimeState.APPROVED,
                leaveStatus: LeaveStatus.APPROVED,
                subFlowStates
            };
        }

        return {
            masterState: WorkflowMasterRuntimeState.PENDING,
            leaveStatus: LeaveStatus.NEW,
            subFlowStates
        };
    }

    private static async buildSubFlow(
        policy: WorkflowPolicy,
        context: WorkflowExecutionContext
    ): Promise<WorkflowSubFlow> {
        const sortedSteps = this.sortPolicySteps(policy.steps);
        const stepMap = new Map<number, WorkflowSubFlowStep[]>();

        for (const [index, step] of sortedSteps.entries()) {
            const safetyResult = await this.resolveStepWithSafety(step, context);
            const parallelGroupId = step.parallelGroupId ?? `seq-${step.sequence}`;
            const stepState = safetyResult.stepSkipped
                ? WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL
                : WorkflowStepRuntimeState.READY;

            const subFlowStep: WorkflowSubFlowStep = {
                id: `${policy.id}:step:${step.sequence}:${index}`,
                sequence: step.sequence,
                parallelGroupId,
                resolver: step.resolver,
                resolverId: step.resolverId,
                scope: step.scope,
                action: step.action,
                state: stepState,
                resolverIds: [...safetyResult.resolverIds].sort((a, b) => a.localeCompare(b)),
                fallbackUsed: safetyResult.fallbackUsed,
                skipped: safetyResult.stepSkipped
            };

            if (!stepMap.has(step.sequence)) {
                stepMap.set(step.sequence, []);
            }
            stepMap.get(step.sequence)!.push(subFlowStep);
        }

        const stepGroups: WorkflowSubFlowStepGroup[] = Array.from(stepMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([sequence, steps]) => ({
                sequence,
                steps: steps.sort((left, right) => {
                    const groupCmp = left.parallelGroupId.localeCompare(right.parallelGroupId);
                    if (groupCmp !== 0) return groupCmp;
                    const resolverCmp = left.resolver.localeCompare(right.resolver);
                    if (resolverCmp !== 0) return resolverCmp;
                    return (left.resolverId ?? '').localeCompare(right.resolverId ?? '');
                })
            }));

        return {
            id: `subflow:${policy.id}`,
            policyId: policy.id,
            origin: {
                policyId: policy.id,
                policyName: policy.name,
                requestType: policy.trigger.requestType,
                role: policy.trigger.role,
                projectType: policy.trigger.projectType
            },
            stepGroups,
            watcherUserIds: []
        };
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

    /**
     * Self-approval safety logic - check if approver is the same as requester
     */
    static isSelfApproval(approverId: string, requesterId: string): boolean {
        return approverId === requesterId;
    }

    /**
     * Level 3 Fallback: Get Company Admins as final safety net
     */
    static async getCompanyAdminFallback(companyId: string, requesterId: string): Promise<string[]> {
        const admins = await prisma.user.findMany({
            where: {
                companyId: companyId,
                isAdmin: true,
                activated: true,
                deletedAt: null,
                id: { not: requesterId }
            },
            select: { id: true },
            orderBy: [
                { name: 'asc' },
                { lastname: 'asc' }
            ]
        });

        return admins.map(admin => admin.id);
    }

    /**
     * Level 2 Fallback: Get Department Manager (boss/supervisors) of requester's department
     */
    static async getDepartmentManagerFallback(departmentId: string, companyId: string, requesterId: string): Promise<string[]> {
        // Get department supervisors
        const supervisors = await prisma.departmentSupervisor.findMany({
            where: { departmentId: departmentId },
            include: { user: true }
        });

        // Get department boss
        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: { boss: true }
        });

        const managerIds = [
            ...supervisors.map(s => s.userId),
            ...(department?.bossId ? [department.bossId] : [])
        ].filter(id => id !== requesterId); // Exclude self

        if (managerIds.length === 0) {
            // Fallback to company admins if no department managers
            return this.getCompanyAdminFallback(companyId, requesterId);
        }

        // Filter to active users
        const activeManagers = await prisma.user.findMany({
            where: {
                id: { in: managerIds },
                activated: true,
                deletedAt: null
            },
            select: { id: true }
        });

        const validManagers = activeManagers.map(u => u.id);

        // If all managers are the requester (or none active), fallback to company admins
        if (validManagers.length === 0) {
            return this.getCompanyAdminFallback(companyId, requesterId);
        }

        return validManagers;
    }

    /**
     * Get fallback approvers with recursive safety logic
     * Handles case where fallback resolver is also the requester
     */
    static async getFallbackApprover(
        context: WorkflowExecutionContext,
        policyLevel?: number
    ): Promise<string[]> {
        const { request, company } = context;

        // Level 1: Policy-specific fallback (for future schema)
        if (policyLevel === 1) {
            // This would be implemented when we add policy-specific fallback rules
            // For now, proceed to level 2
        }

        // Level 2: Department Manager fallback
        if (request.departmentId) {
            const deptManagers = await this.getDepartmentManagerFallback(
                request.departmentId,
                company.id,
                request.userId
            );

            // Check if we got valid managers (not just company admin fallback)
            const hasDepartmentManagers = await prisma.user.findFirst({
                where: {
                    id: { in: deptManagers },
                    isAdmin: false // Company admins are fallback, not primary managers
                }
            });

            if (hasDepartmentManagers) {
                return deptManagers;
            }
        }

        // Level 3: Company Admin fallback (final safety net)
        return this.getCompanyAdminFallback(company.id, request.userId);
    }

    /**
     * Filter out self-approvals and apply fallback logic if needed
     */
    static async applySelfApprovalSafety(
        resolverIds: string[],
        context: WorkflowExecutionContext,
        step: WorkflowStep
    ): Promise<{ validResolvers: string[]; requiresFallback: boolean; stepSkipped: boolean }> {
        const { request } = context;

        // Filter out self-approvals
        const validResolvers = resolverIds.filter(id => !this.isSelfApproval(id, request.userId));

        // Check if step needs to be skipped (all resolvers were self)
        const allResolversWereSelf = validResolvers.length === 0 && resolverIds.length > 0;

        // If no valid resolvers and not because all were self, we need fallback
        const requiresFallback = validResolvers.length === 0 && !allResolversWereSelf;

        return {
            validResolvers,
            requiresFallback,
            stepSkipped: allResolversWereSelf
        };
    }

    /**
     * Enhanced resolveStep with safety logic
     */
    static async resolveStepWithSafety(
        step: WorkflowStep,
        context: WorkflowExecutionContext
    ): Promise<{ resolverIds: string[]; stepSkipped: boolean; fallbackUsed: boolean }> {
        // First try normal resolution
        const resolverIds = await this.resolveStep(step, context);

        // Apply self-approval safety
        const safetyResult = await this.applySelfApprovalSafety(resolverIds, context, step);

        let finalResolvers = safetyResult.validResolvers;
        let fallbackUsed = false;

        // If we need fallback, get fallback approvers
        if (safetyResult.requiresFallback) {
            const fallbackApprovers = await this.getFallbackApprover(context);
            // Apply self-approval filter to fallback approvers as well
            finalResolvers = fallbackApprovers.filter(id => !this.isSelfApproval(id, context.request.userId));
            fallbackUsed = true;
        }

        // Final safety check - ensure we always have at least one approver
        if (finalResolvers.length === 0) {
            // Last resort: get company admins (excluding self)
            const lastResort = await this.getCompanyAdminFallback(context.company.id, context.request.userId);
            finalResolvers = lastResort;
            fallbackUsed = true;
        }

        return {
            resolverIds: finalResolvers,
            stepSkipped: safetyResult.stepSkipped,
            fallbackUsed
        };
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

    private static normalizeAnyValue(value: string | null | undefined): string {
        if (!value) return 'ANY';
        const trimmed = value.trim();
        if (this.isAnyValue(trimmed)) return 'ANY';
        return trimmed;
    }

    private static isAnyValue(value: string | null | undefined): boolean {
        if (!value) return true;
        const normalized = value.trim().toUpperCase();
        return this.ANY_MARKERS.has(normalized);
    }

    private static getStringCandidates(value: string): string[] {
        return Array.from(new Set([value, 'ALL', 'ANY', '*']));
    }

    private static normalizeRuleRoleTrigger(
        rule: ApprovalRule & { subjectRole?: { id: string; name: string } | null },
        effectiveRoleIds: string[],
        effectiveRoleNames: string[]
    ): string {
        if (rule.subjectRoleId && effectiveRoleIds.includes(rule.subjectRoleId)) {
            return rule.subjectRoleId;
        }

        if (rule.subjectRole && this.isAnyValue(rule.subjectRole.name)) {
            return 'ANY';
        }

        if (this.isAnyValue(rule.subjectRoleId)) {
            return 'ANY';
        }

        return rule.subjectRoleId ?? effectiveRoleIds[0] ?? effectiveRoleNames[0] ?? 'ANY';
    }

    private static normalizeRuleRoleName(
        rule: ApprovalRule & { subjectRole?: { name: string } | null },
        effectiveRoleNames: string[]
    ): string {
        if (rule.subjectRole?.name) {
            if (this.isAnyValue(rule.subjectRole.name)) {
                return 'Any';
            }
            return rule.subjectRole.name;
        }

        return effectiveRoleNames[0] ?? 'Any';
    }

    private static async collectEffectiveRequesterRoles(params: {
        userId: string;
        defaultRole: { id: string; name: string } | null;
        projectId: string | null;
        now: Date;
    }): Promise<Array<{ id: string; name: string }>> {
        const { userId, defaultRole, projectId, now } = params;

        const userProjects = await prisma.userProject.findMany({
            where: {
                userId,
                roleId: { not: null },
                ...(projectId ? { projectId } : {}),
                startDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } }
                ]
            },
            include: {
                role: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                project: {
                    select: {
                        status: true,
                        archived: true
                    }
                }
            }
        });

        const deduped = new Map<string, { id: string; name: string }>();

        if (defaultRole) {
            deduped.set(defaultRole.id, defaultRole);
        }

        for (const entry of userProjects) {
            if (!entry.role) continue;
            if (!entry.project) continue;
            if (entry.project.archived || entry.project.status !== ProjectStatus.ACTIVE) continue;

            deduped.set(entry.role.id, {
                id: entry.role.id,
                name: entry.role.name
            });
        }

        return Array.from(deduped.values()).sort((a, b) => a.id.localeCompare(b.id));
    }

    private static isApprovalRuleMatch(params: {
        rule: ApprovalRule & { subjectRole?: { name: string } | null };
        requestType: string;
        projectType: string | null;
        requesterAreaId: string | null;
        effectiveRoleIds: string[];
        subjectAreaClause: Array<{ subjectAreaId: string | null }>;
    }): boolean {
        const { rule, requestType, projectType, requesterAreaId, effectiveRoleIds, subjectAreaClause } = params;
        const ruleSubjectAreaId = rule.subjectAreaId ?? null;

        const requestMatches = this.isAnyValue(rule.requestType) || rule.requestType === requestType;
        if (!requestMatches) return false;

        const projectMatches = this.isAnyValue(rule.projectType) || (!!projectType && rule.projectType === projectType);
        if (!projectMatches) return false;

        const roleMatches = effectiveRoleIds.includes(rule.subjectRoleId) || this.isAnyValue(rule.subjectRole?.name);
        if (!roleMatches) return false;

        if (!requesterAreaId) {
            return ruleSubjectAreaId === null;
        }

        return subjectAreaClause.some((clause) => clause.subjectAreaId === ruleSubjectAreaId);
    }

    private static isWatcherRuleMatch(params: {
        rule: WatcherRule & {
            role?: { id: string } | null;
            team?: { id: string } | null;
            project?: { id: string; archived: boolean; status: ProjectStatus } | null;
            contractType?: { id: string } | null;
        };
        requestType: string;
        projectType: string | null;
        requesterContractTypeId: string | null;
    }): boolean {
        const { rule, requestType, projectType, requesterContractTypeId } = params;

        const requestMatches = this.isAnyValue(rule.requestType) || rule.requestType === requestType;
        if (!requestMatches) return false;

        const projectTypeMatches =
            rule.projectType === null ||
            this.isAnyValue(rule.projectType) ||
            (!!projectType && rule.projectType === projectType);
        if (!projectTypeMatches) return false;

        const contractTypeMatches =
            rule.contractTypeId === null ||
            this.isAnyValue(rule.contractTypeId) ||
            (!!requesterContractTypeId && rule.contractTypeId === requesterContractTypeId);
        if (!contractTypeMatches) return false;

        // Guard against stale/inactive related entities before policy emission.
        if (rule.roleId && !rule.role) return false;
        if (rule.teamId && !rule.team) return false;
        if (rule.projectId) {
            if (!rule.project) return false;
            if (rule.project.archived || rule.project.status !== ProjectStatus.ACTIVE) return false;
        }
        if (rule.contractTypeId && !rule.contractType) return false;

        return true;
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

    private static sortPolicySteps(steps: WorkflowStep[]): WorkflowStep[] {
        return [...steps].sort((left, right) => {
            if (left.sequence !== right.sequence) {
                return left.sequence - right.sequence;
            }

            const leftGroup = left.parallelGroupId ?? '';
            const rightGroup = right.parallelGroupId ?? '';
            const groupCmp = leftGroup.localeCompare(rightGroup);
            if (groupCmp !== 0) {
                return groupCmp;
            }

            const resolverCmp = left.resolver.localeCompare(right.resolver);
            if (resolverCmp !== 0) {
                return resolverCmp;
            }

            return (left.resolverId ?? '').localeCompare(right.resolverId ?? '');
        });
    }

    private static getSubFlowRuntimeState(subFlow: WorkflowSubFlow): WorkflowSubFlowRuntimeState {
        const steps = subFlow.stepGroups.flatMap((group) => group.steps);
        if (steps.length === 0) {
            return WorkflowSubFlowRuntimeState.APPROVED;
        }

        const hasRejected = steps.some((step) => step.state === WorkflowStepRuntimeState.REJECTED);
        if (hasRejected) {
            return WorkflowSubFlowRuntimeState.REJECTED;
        }

        const allRequiredClosed = steps
            .filter((step) => step.action !== 'NOTIFY')
            .every((step) =>
                step.state === WorkflowStepRuntimeState.APPROVED ||
                step.state === WorkflowStepRuntimeState.AUTO_APPROVED ||
                step.state === WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL
            );

        return allRequiredClosed
            ? WorkflowSubFlowRuntimeState.APPROVED
            : WorkflowSubFlowRuntimeState.PENDING;
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
