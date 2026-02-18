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

        // 1. Get user and their projects
        const user = await prisma.user.findFirst({
            where: { id: userId, activated: true, deletedAt: null },
            include: {
                department: {
                    include: { supervisors: { include: { user: true } } }
                },
                defaultRole: true,
                area: true,
                projects: {
                    where: {
                        project: { archived: false, status: 'ACTIVE' as any }
                    },
                    include: { project: true }
                }
            }
        });

        if (!user) throw new Error('User not found');

        // 2. Identify contexts to evaluate
        const contexts: Array<{ id: string | null; type: string | null }> = [
            { id: null, type: null } // Global Context
        ];

        const projectContexts = new Map<string, { id: string; type: string | null }>();

        if (projectId) {
            const targetProject = user.projects.find(p => p.projectId === projectId);
            if (targetProject) {
                projectContexts.set(targetProject.projectId, {
                    id: targetProject.projectId,
                    type: targetProject.project.type ?? null
                });
            }
        }

        for (const up of user.projects) {
            if (!projectContexts.has(up.projectId)) {
                projectContexts.set(up.projectId, {
                    id: up.projectId,
                    type: up.project.type ?? null
                });
            }
        }

        contexts.push(...projectContexts.values());

        // 3. Fetch all rules for the company once to minimize DB hits
        const requestTypeCandidates = this.getStringCandidates(normalizedRequestType);

        const [approvalRules, watcherRules] = await Promise.all([
            prisma.approvalRule.findMany({
                where: {
                    companyId: user.companyId,
                    requestType: { in: requestTypeCandidates },
                },
                include: { approverRole: true, subjectRole: true, subjectArea: true },
                orderBy: [{ sequenceOrder: 'asc' }, { id: 'asc' }]
            }),
            prisma.watcherRule.findMany({
                where: {
                    companyId: user.companyId,
                    requestType: { in: requestTypeCandidates }
                },
                include: { role: true, team: true, project: true, contractType: true },
                orderBy: { id: 'asc' }
            })
        ]);

        const subjectAreaClause = user.areaId
            ? [{ subjectAreaId: null }, { subjectAreaId: user.areaId }]
            : [{ subjectAreaId: null }];

        const policyMap = new Map<string, {
            trigger: WorkflowTrigger;
            rules: ApprovalRule[];
            watchers: WatcherRule[];
            ruleIds: Set<string>;
            watcherIds: Set<string>;
        }>();

        // 4. Evaluate each context independently
        for (const context of contexts) {
            const effectiveRoles = await this.collectEffectiveRequesterRoles({
                userId: user.id,
                defaultRole: user.defaultRole ? { id: user.defaultRole.id, name: user.defaultRole.name } : null,
                projectId: context.id,
                now
            });

            if (effectiveRoles.length === 0) continue;
            const effectiveRoleIds = effectiveRoles.map(r => r.id);
            const effectiveRoleNames = effectiveRoles.map(r => r.name);

            // Match approval rules for THIS context
            const matchedRules = approvalRules.filter((rule) => this.isApprovalRuleMatch({
                rule,
                requestType: normalizedRequestType,
                projectType: context.type,
                requesterAreaId: user.areaId,
                effectiveRoleIds,
                subjectAreaClause
            }));

            // Group into policies
            for (const rule of matchedRules) {
                const triggerKey = this.generateTriggerKey(
                    user.companyId,
                    this.normalizeAnyValue(rule.requestType),
                    this.normalizeAnyValue(rule.projectType),
                    this.normalizeRuleRoleTrigger(rule, effectiveRoleIds, effectiveRoleNames),
                    rule.subjectAreaId ?? undefined,
                    context.id ?? undefined
                );

                if (!policyMap.has(triggerKey)) {
                    policyMap.set(triggerKey, {
                        trigger: {
                            requestType: this.normalizeAnyValue(rule.requestType),
                            contractType: user.contractTypeId || undefined,
                            role: this.normalizeRuleRoleName(rule, effectiveRoleNames),
                            department: user.department?.name,
                            projectType: this.normalizeAnyValue(rule.projectType) || undefined,
                            projectId: context.id ?? undefined
                        },
                        rules: [],
                        watchers: [],
                        ruleIds: new Set<string>(),
                        watcherIds: new Set<string>()
                    });
                }

                const policyData = policyMap.get(triggerKey)!;
                if (!policyData.ruleIds.has(rule.id)) {
                    policyData.rules.push(rule);
                    policyData.ruleIds.add(rule.id);
                }
            }

            // Match watcher rules for THIS context
            const matchedWatcherRules = watcherRules.filter((rule) => this.isWatcherRuleMatch({
                rule,
                requestType: normalizedRequestType,
                projectType: context.type,
                requesterContractTypeId: user.contractTypeId ?? null
            }));

            // Group watchers into policies matched for this context
            for (const [key, policyData] of policyMap.entries()) {
                if (policyData.trigger.projectId === (context.id ?? undefined)) {
                    for (const watcherRule of matchedWatcherRules) {
                        if (!policyData.watcherIds.has(watcherRule.id)) {
                            policyData.watchers.push(watcherRule);
                            policyData.watcherIds.add(watcherRule.id);
                        }
                    }
                }
            }
        }

        // 5. Convert to final WorkflowPolicy format
        const policies: WorkflowPolicy[] = [];
        for (const [triggerKey, policyData] of policyMap.entries()) {
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

            const watchers: WorkflowWatcher[] = policyData.watchers.map(rule => ({
                resolver: this.mapWatcherRuleToResolverType(rule),
                resolverId: this.getWatcherResolverId(rule),
                scope: ContextScope.GLOBAL
            }));

            policies.push({
                id: triggerKey,
                name: this.generatePolicyName(policyData.trigger),
                trigger: policyData.trigger,
                steps,
                watchers,
                isActive: true,
                companyId: user.companyId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
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

        return await this.applyScope(resolvers, step.scope, context);
    }

    private static async resolveDepartmentManagers(
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        const { request } = context;
        if (!request.departmentId) return [];

        const supervisors = await prisma.departmentSupervisor.findMany({
            where: { departmentId: request.departmentId },
            include: { user: true }
        });

        const department = await prisma.department.findUnique({
            where: { id: request.departmentId },
            include: { boss: true }
        });

        const managerIds = [
            ...supervisors.map(s => s.userId),
            ...(department?.bossId ? [department.bossId] : [])
        ];

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
        return this.resolveDepartmentManagers(context);
    }

    private static async resolveUsersByRole(
        roleId: string,
        context: WorkflowExecutionContext,
        scope: ContextScope
    ): Promise<string[]> {
        const { request } = context;

        let whereClause: any = {
            OR: [
                { roleId: roleId },
                { user: { defaultRoleId: roleId } }
            ],
            user: {
                companyId: context.company.id,
                activated: true,
                deletedAt: null
            }
        };

        if (scope === ContextScope.SAME_PROJECT) {
            if (!request.projectId) return [];
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

        if (scope === ContextScope.SAME_AREA && request.areaId) {
            userIds = userProjects
                .filter(up => up.user.areaId === request.areaId)
                .map(up => up.userId);
        }

        if (scope === ContextScope.SAME_DEPARTMENT && request.departmentId) {
            userIds = userProjects
                .filter(up => up.user.departmentId === request.departmentId)
                .map(up => up.userId);
        }

        return Array.from(new Set(userIds));
    }

    static async applyScope(
        potentialApprovers: string[],
        scope: ContextScope,
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        if (scope === ContextScope.GLOBAL || potentialApprovers.length === 0) {
            return potentialApprovers;
        }

        const { request } = context;

        const users = await prisma.user.findMany({
            where: {
                id: { in: potentialApprovers },
                activated: true,
                deletedAt: null
            },
            select: { id: true, areaId: true, departmentId: true }
        });

        if (scope === ContextScope.SAME_AREA && request.areaId) {
            return users.filter(u => u.areaId === request.areaId).map(u => u.id);
        }

        if (scope === ContextScope.SAME_DEPARTMENT && request.departmentId) {
            return users.filter(u => u.departmentId === request.departmentId).map(u => u.id);
        }

        if (scope === ContextScope.SAME_PROJECT) {
            if (!request.projectId) return [];
            const userProjects = await prisma.userProject.findMany({
                where: {
                    userId: { in: potentialApprovers },
                    projectId: request.projectId
                },
                select: { userId: true }
            });
            const projectUserIds = new Set(userProjects.map(up => up.userId));
            return potentialApprovers.filter(id => projectUserIds.has(id));
        }

        return potentialApprovers;
    }

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
            // Apply policy-specific context (projectId) if available
            const policyContext = {
                ...context,
                request: {
                    ...context.request,
                    projectId: policy.trigger.projectId || context.request.projectId
                }
            };

            const subFlow = await this.buildSubFlow(policy, policyContext);
            resolution.subFlows.push(subFlow);

            for (const group of subFlow.stepGroups) {
                for (const step of group.steps) {
                    for (const resolverId of step.resolverIds) {
                        resolution.resolvers.push({
                            userId: resolverId,
                            type: step.resolver,
                            step: step.sequence,
                            policyId: subFlow.policyId
                        });
                    }
                }
            }

            for (const watcher of policy.watchers) {
                const watcherIds = await this.resolveWatcher(watcher, policyContext);
                const validWatchers = watcherIds.filter((id) => !this.isSelfApproval(id, context.request.userId));

                for (const watcherId of validWatchers) {
                    resolution.watchers.push({
                        userId: watcherId,
                        type: watcher.resolver
                    });
                }
            }
        }

        if (resolution.resolvers.length === 0) {
            const lastResortApprovers = await this.getCompanyAdminFallback(
                context.company.id,
                context.request.userId
            );

            for (const approverId of lastResortApprovers) {
                resolution.resolvers.push({
                    userId: approverId,
                    type: ResolverType.SPECIFIC_USER,
                    step: 999,
                    policyId: 'SAFETY_NET'
                });
            }
        }

        resolution.subFlows = resolution.subFlows.map((subFlow) => ({
            ...subFlow,
            watcherUserIds: Array.from(
                new Set(
                    resolution.watchers.map((watcher) => watcher.userId)
                )
            ).sort((a, b) => a.localeCompare(b))
        }));

        resolution.resolvers = this.deduplicateResolvers(resolution.resolvers);
        resolution.watchers = this.deduplicateResolvers(resolution.watchers);

        return resolution;
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
                projectType: policy.trigger.projectType,
                projectId: policy.trigger.projectId
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

    static isSelfApproval(approverId: string, requesterId: string): boolean {
        return approverId === requesterId;
    }

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
            orderBy: [{ name: 'asc' }, { lastname: 'asc' }]
        });

        return admins.map(admin => admin.id);
    }

    static async getDepartmentManagerFallback(departmentId: string, companyId: string, requesterId: string): Promise<string[]> {
        const supervisors = await prisma.departmentSupervisor.findMany({
            where: { departmentId: departmentId },
            include: { user: true }
        });

        const department = await prisma.department.findUnique({
            where: { id: departmentId },
            include: { boss: true }
        });

        const managerIds = [
            ...supervisors.map(s => s.userId),
            ...(department?.bossId ? [department.bossId] : [])
        ].filter(id => id !== requesterId);

        if (managerIds.length === 0) {
            return this.getCompanyAdminFallback(companyId, requesterId);
        }

        const activeManagers = await prisma.user.findMany({
            where: {
                id: { in: managerIds },
                activated: true,
                deletedAt: null
            },
            select: { id: true }
        });

        const validManagers = activeManagers.map(u => u.id);
        if (validManagers.length === 0) {
            return this.getCompanyAdminFallback(companyId, requesterId);
        }

        return validManagers;
    }

    static async getFallbackApprover(
        context: WorkflowExecutionContext,
        policyLevel?: number
    ): Promise<string[]> {
        const { request, company } = context;

        if (request.departmentId) {
            const deptManagers = await this.getDepartmentManagerFallback(
                request.departmentId,
                company.id,
                request.userId
            );

            const hasDepartmentManagers = await prisma.user.findFirst({
                where: {
                    id: { in: deptManagers },
                    isAdmin: false
                }
            });

            if (hasDepartmentManagers) {
                return deptManagers;
            }
        }

        return this.getCompanyAdminFallback(company.id, request.userId);
    }

    static async applySelfApprovalSafety(
        resolverIds: string[],
        context: WorkflowExecutionContext,
        step: WorkflowStep
    ): Promise<{ validResolvers: string[]; requiresFallback: boolean; stepSkipped: boolean }> {
        const { request } = context;
        const validResolvers = resolverIds.filter(id => !this.isSelfApproval(id, request.userId));
        const allResolversWereSelf = validResolvers.length === 0 && resolverIds.length > 0;
        const requiresFallback = validResolvers.length === 0 && !allResolversWereSelf;

        return {
            validResolvers,
            requiresFallback,
            stepSkipped: allResolversWereSelf
        };
    }

    static async resolveStepWithSafety(
        step: WorkflowStep,
        context: WorkflowExecutionContext
    ): Promise<{ resolverIds: string[]; stepSkipped: boolean; fallbackUsed: boolean }> {
        const resolverIds = await this.resolveStep(step, context);
        const safetyResult = await this.applySelfApprovalSafety(resolverIds, context, step);

        let finalResolvers = safetyResult.validResolvers;
        let fallbackUsed = false;

        if (safetyResult.requiresFallback) {
            const fallbackApprovers = await this.getFallbackApprover(context);
            finalResolvers = fallbackApprovers.filter(id => !this.isSelfApproval(id, context.request.userId));
            fallbackUsed = true;
        }

        if (finalResolvers.length === 0) {
            finalResolvers = await this.getCompanyAdminFallback(context.company.id, context.request.userId);
            fallbackUsed = true;
        }

        return {
            resolverIds: finalResolvers,
            stepSkipped: safetyResult.stepSkipped,
            fallbackUsed
        };
    }

    private static generateTriggerKey(
        companyId: string,
        requestType: string,
        projectType: string | undefined,
        subjectRoleId: string | undefined,
        subjectAreaId: string | undefined,
        projectId: string | undefined
    ): string {
        return `${companyId}:${requestType}:${projectType || 'null'}:${subjectRoleId || 'null'}:${subjectAreaId || 'null'}:${projectId || 'null'}`;
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
        const candidates = new Set([value, 'ALL', 'ANY', '*']);
        if (value === 'LEAVE') candidates.add('LEAVE_REQUEST');
        if (value === 'LEAVE_REQUEST') candidates.add('LEAVE');
        return Array.from(candidates);
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
                OR: [{ endDate: null }, { endDate: { gte: now } }]
            },
            include: {
                role: { select: { id: true, name: true } },
                project: { select: { status: true, archived: true } }
            }
        });

        const deduped = new Map<string, { id: string; name: string }>();
        if (defaultRole) deduped.set(defaultRole.id, defaultRole);

        // If no specific project context, only return default roles to avoid cross-project leakage.
        // Project roles will be captured when evaluating their respective contexts.
        if (!projectId) return Array.from(deduped.values()).sort((a, b) => a.id.localeCompare(b.id));

        for (const entry of userProjects) {
            if (!entry.role || !entry.project) continue;
            if (entry.project.archived || entry.project.status !== ProjectStatus.ACTIVE) continue;
            deduped.set(entry.role.id, { id: entry.role.id, name: entry.role.name });
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

        if (!(this.isAnyValue(rule.requestType) || rule.requestType === requestType)) return false;
        if (!(this.isAnyValue(rule.projectType) || (!!projectType && rule.projectType === projectType))) return false;
        if (!(effectiveRoleIds.includes(rule.subjectRoleId) || this.isAnyValue(rule.subjectRole?.name))) return false;

        if (!requesterAreaId) return ruleSubjectAreaId === null;
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

        if (!(this.isAnyValue(rule.requestType) || rule.requestType === requestType)) return false;
        if (!(rule.projectType === null || this.isAnyValue(rule.projectType) || (!!projectType && rule.projectType === projectType))) return false;
        if (!(rule.contractTypeId === null || this.isAnyValue(rule.contractTypeId) || (!!requesterContractTypeId && rule.contractTypeId === requesterContractTypeId))) return false;

        if (rule.roleId && !rule.role) return false;
        if (rule.teamId && !rule.team) return false;
        if (rule.projectId) {
            if (!rule.project || rule.project.archived || rule.project.status !== ProjectStatus.ACTIVE) return false;
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
            case 'SAME_AREA':
                return ContextScope.SAME_AREA;
            case 'SAME_PROJECT':
                return ContextScope.SAME_PROJECT;
            case 'SAME_DEPARTMENT':
                return ContextScope.SAME_DEPARTMENT;
            default:
                return ContextScope.GLOBAL;
        }
    }

    private static mapWatcherRuleToResolverType(rule: any): ResolverType {
        if (rule.roleId || rule.projectId || rule.teamId) return ResolverType.ROLE;
        return ResolverType.SPECIFIC_USER;
    }

    private static getWatcherResolverId(rule: any): string | undefined {
        return rule.roleId || rule.projectId || rule.teamId;
    }

    private static sortPolicySteps(steps: WorkflowStep[]): WorkflowStep[] {
        return [...steps].sort((left, right) => {
            if (left.sequence !== right.sequence) return left.sequence - right.sequence;
            const leftGroup = left.parallelGroupId ?? '';
            const rightGroup = right.parallelGroupId ?? '';
            const groupCmp = leftGroup.localeCompare(rightGroup);
            if (groupCmp !== 0) return groupCmp;
            const resolverCmp = left.resolver.localeCompare(right.resolver);
            if (resolverCmp !== 0) return resolverCmp;
            return (left.resolverId ?? '').localeCompare(right.resolverId ?? '');
        });
    }

    static aggregateOutcome(resolution: WorkflowResolution): WorkflowAggregateOutcome {
        const subFlowStates = resolution.subFlows.map((subFlow) => ({
            subFlowId: subFlow.id,
            state: this.getSubFlowRuntimeState(subFlow)
        }));

        const hasRejected = subFlowStates.some((entry) => entry.state === WorkflowSubFlowRuntimeState.REJECTED);
        if (hasRejected) {
            return {
                masterState: WorkflowMasterRuntimeState.REJECTED,
                leaveStatus: 'rejected',
                subFlowStates
            };
        }

        const allApproved = subFlowStates.length > 0 && subFlowStates.every((entry) => entry.state === WorkflowSubFlowRuntimeState.APPROVED);
        if (allApproved) {
            return {
                masterState: WorkflowMasterRuntimeState.APPROVED,
                leaveStatus: 'approved',
                subFlowStates
            };
        }

        return {
            masterState: WorkflowMasterRuntimeState.PENDING,
            leaveStatus: 'new',
            subFlowStates
        };
    }

    static aggregateOutcomeFromApprovalSteps(steps: Array<{ id: string; approverId: string; status: number; sequenceOrder: number | null; }>): WorkflowAggregateOutcome {
        const grouped = new Map<number, WorkflowSubFlowStep[]>();

        for (const step of steps) {
            const sequence = step.sequenceOrder ?? 999;
            const mappedState = this.mapPersistedStepStatus(step.status);
            const runtimeStep: WorkflowSubFlowStep = {
                id: step.id,
                sequence,
                parallelGroupId: `seq-${sequence}`,
                resolver: ResolverType.SPECIFIC_USER,
                resolverId: step.approverId,
                scope: ContextScope.GLOBAL,
                action: 'APPROVE',
                state: mappedState,
                resolverIds: [step.approverId],
                fallbackUsed: false,
                skipped: mappedState === WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL
            };

            if (!grouped.has(sequence)) grouped.set(sequence, []);
            grouped.get(sequence)!.push(runtimeStep);
        }

        const syntheticResolution: WorkflowResolution = {
            resolvers: [],
            watchers: [],
            subFlows: [{
                id: 'subflow:persisted',
                policyId: 'persisted',
                origin: {
                    policyId: 'persisted',
                    policyName: 'Persisted Approval Steps',
                    requestType: 'LEAVE_REQUEST',
                    projectId: undefined
                },
                stepGroups: Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]).map(([sequence, groupedSteps]) => ({ sequence, steps: groupedSteps })),
                watcherUserIds: []
            }]
        };

        return this.aggregateOutcome(syntheticResolution);
    }

    private static getSubFlowRuntimeState(subFlow: WorkflowSubFlow): WorkflowSubFlowRuntimeState {
        const steps = subFlow.stepGroups.flatMap((group) => group.steps);
        if (steps.length === 0) return WorkflowSubFlowRuntimeState.APPROVED;

        const hasRejected = steps.some((step) => step.state === WorkflowStepRuntimeState.REJECTED);
        if (hasRejected) return WorkflowSubFlowRuntimeState.REJECTED;

        const allRequiredClosed = steps
            .filter((step) => step.action !== 'NOTIFY')
            .every((step) =>
                step.state === WorkflowStepRuntimeState.APPROVED ||
                step.state === WorkflowStepRuntimeState.AUTO_APPROVED ||
                step.state === WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL
            );

        return allRequiredClosed ? WorkflowSubFlowRuntimeState.APPROVED : WorkflowSubFlowRuntimeState.PENDING;
    }

    private static mapPersistedStepStatus(status: number): WorkflowStepRuntimeState {
        if (status === 1) return WorkflowStepRuntimeState.APPROVED;
        if (status === 2) return WorkflowStepRuntimeState.REJECTED;
        return WorkflowStepRuntimeState.PENDING;
    }

    private static deduplicateResolvers<T extends { userId: string; type: ResolverType; step?: number; policyId?: string }>(
        resolvers: T[]
    ): T[] {
        const seen = new Map<string, T>();
        for (const resolver of resolvers) {
            const key = resolver.userId;
            if (!seen.has(key) || (resolver.step && (!seen.get(key)!.step || resolver.step < seen.get(key)!.step!))) {
                seen.set(key, resolver);
            }
        }
        return Array.from(seen.values());
    }
}
