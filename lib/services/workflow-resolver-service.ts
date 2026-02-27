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
import { ProjectStatus } from '../generated/prisma/client';
import { WorkflowFormValues } from '../validations/workflow';

export class WorkflowResolverService {
    private static readonly ANY_MARKERS = new Set(['ANY', 'ALL', '*']);
    private static readonly RUNTIME_CACHE_KEY = '__workflowRuntimeCache';

    /**
     * Find all matching policies for a given request context
     * Aggregates rules from ApprovalRule based on Multi-Role logic (UNION)
     */
    static async findMatchingPolicies(
        userId: string,
        projectId: string | null,
        requestType: string,
        leaveTypeId?: string
    ): Promise<WorkflowPolicy[]> {
        const startedAtMs = Date.now();
        const now = new Date();
        const normalizedRequestType = requestType.trim().toUpperCase();

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
                        startDate: { lte: now },
                        OR: [{ endDate: null }, { endDate: { gte: now } }],
                        project: { archived: false, status: 'ACTIVE' as any }
                    },
                    include: { project: true }
                }
            }
        });

        if (!user) throw new Error('User not found');

        // 2. Identify contexts to evaluate
        // Evaluate all relevant project contexts when projectId is missing to ensure
        // project-specific roles (e.g., Tech Lead) trigger their respective policies.
        const contexts: Array<{ id: string | null; type: string | null }> = [];
        const userProjects = user.projects ?? [];

        if (projectId) {
            const targetProject = userProjects.find((p) => p.projectId === projectId);
            if (targetProject) {
                contexts.push({
                    id: targetProject.projectId,
                    type: targetProject.project.type ?? null
                });
            } else {
                const standaloneProject = await prisma.project.findFirst({
                    where: {
                        id: projectId,
                        archived: false,
                        status: 'ACTIVE' as any
                    },
                    select: { id: true, type: true }
                });
                if (standaloneProject) {
                    contexts.push({
                        id: standaloneProject.id,
                        type: standaloneProject.type ?? null
                    });
                }
            }
        } else {
            // Include global context
            contexts.push({ id: null, type: null });

            // Also include all active project contexts the user belongs to
            for (const up of userProjects) {
                contexts.push({
                    id: up.projectId,
                    type: up.project.type ?? null
                });
            }
        }

        if (contexts.length === 0) {
            contexts.push({ id: null, type: null });
        }

        // 3. Fetch all active workflows for the company
        const workflows = await prisma.workflow.findMany({
            where: {
                companyId: user.companyId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                rules: true,
            },
        });

        // Parse workflow rules
        const parsedWorkflows = workflows.map(w => ({
            id: w.id,
            name: w.name,
            rules: w.rules as WorkflowFormValues,
        }));

        // 4. Evaluate each context and match workflows
        const rawPolicies: WorkflowPolicy[] = [];

        for (const context of contexts) {
            const effectiveRoles = await this.collectEffectiveRequesterRoles({
                userId: user.id,
                defaultRole: user.defaultRole ? { id: user.defaultRole.id, name: user.defaultRole.name } : null,
                projectId: context.id,
                now
            });

            if (effectiveRoles.length === 0) continue;
            const effectiveRoleIds = effectiveRoles.map(r => r.id);
            const effectiveRolesById = new Map(effectiveRoles.map((role) => [role.id, role.name]));

            // Match workflows for this context
            for (const workflow of parsedWorkflows) {
                const rules = workflow.rules;

                // Check if workflow matches the request type
                const requestTypes = rules.requestTypes || [];
                const matchesRequestType = requestTypes.length === 0 ||
                    requestTypes.some(rt => {
                        if (this.isAnyValue(rt)) return true;
                        const rtUpper = rt.toUpperCase();
                        return rtUpper === normalizedRequestType || (leaveTypeId && rt === leaveTypeId);
                    });
                if (!matchesRequestType) continue;

                // Check if workflow matches the project type
                const projectTypes = rules.projectTypes || [];
                const matchesProjectType = projectTypes.length === 0 ||
                    projectTypes.some(pt => this.isAnyValue(pt) || (context.type && pt === context.type));
                if (!matchesProjectType) continue;

                // Check if workflow matches subject roles
                const subjectRoles = rules.subjectRoles || [];
                const matchesSubjectRole = subjectRoles.length === 0 ||
                    subjectRoles.some(sr => this.isAnyValue(sr) || effectiveRoleIds.includes(sr));
                if (!matchesSubjectRole) continue;

                // Check if workflow matches departments
                const departments = rules.departments || [];
                const userDepartmentId = user.departmentId;
                const userDepartmentName = user.department?.name;
                const matchesDepartment = departments.length === 0 ||
                    departments.some(d =>
                        this.isAnyValue(d) ||
                        (!!userDepartmentId && d === userDepartmentId) ||
                        (!!userDepartmentName && d === userDepartmentName)
                    );
                if (!matchesDepartment) continue;

                // Check if workflow matches contract types
                const contractTypes = rules.contractTypes || [];
                const matchesContractType = contractTypes.length === 0 ||
                    contractTypes.some(ct => this.isAnyValue(ct) || ct === user.contractTypeId);
                if (!matchesContractType) continue;

                // Build steps from workflow rules
                const steps: WorkflowStep[] = (rules.steps || []).map((step, index) => ({
                    sequence: typeof step.sequence === 'number' && step.sequence > 0
                        ? step.sequence
                        : index + 1,
                    resolver: (step.resolver as ResolverType) ?? ResolverType.SPECIFIC_USER,
                    resolverId: step.resolverId,
                    scope: step.scope as ContextScope[] || [ContextScope.GLOBAL],
                    action: 'APPROVE',
                    autoApprove: step.autoApprove ?? false,
                    parallelGroupId: step.parallelGroupId
                }));

                // Build watchers from workflow rules
                const watchers: WorkflowWatcher[] = (rules.watchers || []).map(watcher => ({
                    resolver: watcher.resolver as ResolverType,
                    resolverId: watcher.resolverId,
                    scope: watcher.scope as ContextScope[] || [ContextScope.GLOBAL]
                }));

                // Generate one policy instance per applicable role+context combination.
                // This preserves independent sub-flow instantiation across the full matrix.
                const matchedRoleIds = (() => {
                    if (subjectRoles.length === 0 || subjectRoles.some((sr) => this.isAnyValue(sr))) {
                        return effectiveRoleIds;
                    }
                    return subjectRoles.filter((sr) => effectiveRolesById.has(sr));
                })();

                for (const roleId of matchedRoleIds) {
                    rawPolicies.push({
                        id: `${workflow.id}-${context.id || 'global'}-${roleId}`,
                        name: workflow.name,
                        trigger: {
                            requestType: normalizedRequestType,
                            contractType: user.contractTypeId || undefined,
                            role: effectiveRolesById.get(roleId) || undefined,
                            department: user.department?.name,
                            projectType: context.type || undefined,
                            projectId: context.id || undefined
                        },
                        steps,
                        watchers,
                        isActive: true,
                        companyId: user.companyId,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
            }
        }

        // Deterministic ordering for reproducible sub-flow generation.
        const sortedPolicies = rawPolicies.sort((left, right) => left.id.localeCompare(right.id));
        const elapsedMs = Date.now() - startedAtMs;
        console.info(`[WORKFLOW_PERF] findMatchingPolicies resolved ${sortedPolicies.length} policies in ${elapsedMs}ms`);
        return sortedPolicies;
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
                return Array.from(new Set(resolvers));

            case ResolverType.DEPARTMENT_MANAGER:
                resolvers = await this.resolveDepartmentManagers(context);
                break;

            case ResolverType.LINE_MANAGER:
                resolvers = await this.resolveLineManagers(context);
                break;
        }

        return await this.applyScopes(resolvers, step.scope, context);
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
            ...(supervisors ?? []).map(s => s.userId),
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
        scope: ContextScope | ContextScope[]
    ): Promise<string[]> {
        const { request } = context;
        const scopes = this.normalizeScopes(scope);
        const hasSameProject = scopes.includes(ContextScope.SAME_PROJECT);
        const cache = this.getRuntimeCache(context);
        const now = new Date();

        if (hasSameProject) {
            if (!request.projectId) return [];
            const projectRoleKey = `project-role-members:${context.company.id}:${request.projectId}:${roleId}`;
            const projectRoleMembers = cache.has(projectRoleKey)
                ? cache.get(projectRoleKey)
                : await prisma.userProject.findMany({
                    where: {
                        roleId,
                        projectId: request.projectId,
                        startDate: { lte: now },
                        OR: [{ endDate: null }, { endDate: { gte: now } }],
                        user: {
                            companyId: context.company.id,
                            activated: true,
                            deletedAt: null
                        }
                    },
                    select: { userId: true, user: { select: { areaId: true, departmentId: true } } }
                });
            cache.set(projectRoleKey, projectRoleMembers);

            // Prefer explicit project-role assignment for project-scoped approvals.
            // Only fallback to default-role members in the project when explicit mapping is absent.
            if (projectRoleMembers.length > 0) {
                let scopedProjectRoleMembers = projectRoleMembers;
                if (scopes.includes(ContextScope.SAME_AREA) && request.areaId) {
                    scopedProjectRoleMembers = scopedProjectRoleMembers.filter((entry) => entry.user.areaId === request.areaId);
                }
                if (scopes.includes(ContextScope.SAME_DEPARTMENT) && request.departmentId) {
                    scopedProjectRoleMembers = scopedProjectRoleMembers.filter((entry) => entry.user.departmentId === request.departmentId);
                }
                return Array.from(new Set(scopedProjectRoleMembers.map((entry) => entry.userId)));
            }

            const defaultRoleKey = `project-default-role-members:${context.company.id}:${request.projectId}:${roleId}`;
            const defaultRoleMembersInProject = cache.has(defaultRoleKey)
                ? cache.get(defaultRoleKey)
                : await prisma.userProject.findMany({
                    where: {
                        projectId: request.projectId,
                        startDate: { lte: now },
                        OR: [{ endDate: null }, { endDate: { gte: now } }],
                        user: {
                            defaultRoleId: roleId,
                            companyId: context.company.id,
                            activated: true,
                            deletedAt: null
                        }
                    },
                    select: { userId: true, user: { select: { areaId: true, departmentId: true } } }
                });
            cache.set(defaultRoleKey, defaultRoleMembersInProject);
            let scopedDefaultRoleMembers = defaultRoleMembersInProject;
            if (scopes.includes(ContextScope.SAME_AREA) && request.areaId) {
                scopedDefaultRoleMembers = scopedDefaultRoleMembers.filter((entry) => entry.user.areaId === request.areaId);
            }
            if (scopes.includes(ContextScope.SAME_DEPARTMENT) && request.departmentId) {
                scopedDefaultRoleMembers = scopedDefaultRoleMembers.filter((entry) => entry.user.departmentId === request.departmentId);
            }
            return Array.from(new Set(scopedDefaultRoleMembers.map((entry) => entry.userId)));
        }

        const usersByDefaultRoleKey = `users-by-default-role:${context.company.id}:${roleId}`;
        const usersByProjectRoleKey = `users-by-project-role:${context.company.id}:${roleId}`;
        const [usersByDefaultRole, usersByProjectRole] = await Promise.all([
            cache.has(usersByDefaultRoleKey)
                ? cache.get(usersByDefaultRoleKey)
                : prisma.user.findMany({
                    where: {
                        defaultRoleId: roleId,
                        companyId: context.company.id,
                        activated: true,
                        deletedAt: null
                    },
                    select: { id: true, areaId: true, departmentId: true }
                }),
            cache.has(usersByProjectRoleKey)
                ? cache.get(usersByProjectRoleKey)
                : prisma.userProject.findMany({
                    where: {
                        roleId,
                        startDate: { lte: now },
                        OR: [{ endDate: null }, { endDate: { gte: now } }],
                        user: {
                            companyId: context.company.id,
                            activated: true,
                            deletedAt: null
                        }
                    },
                    select: {
                        user: {
                            select: { id: true, areaId: true, departmentId: true }
                        }
                    }
                })
        ]);
        cache.set(usersByDefaultRoleKey, usersByDefaultRole);
        cache.set(usersByProjectRoleKey, usersByProjectRole);

        const candidates = new Map<string, { id: string; areaId: string | null; departmentId: string | null }>();
        for (const user of usersByDefaultRole) {
            candidates.set(user.id, user);
        }
        for (const userProject of usersByProjectRole) {
            candidates.set(userProject.user.id, userProject.user);
        }

        const candidateUsers = Array.from(candidates.values());

        let scopedUsers = candidateUsers;
        if (scopes.includes(ContextScope.SAME_AREA) && request.areaId) {
            scopedUsers = scopedUsers.filter((user) => user.areaId === request.areaId);
        }
        if (scopes.includes(ContextScope.SAME_DEPARTMENT) && request.departmentId) {
            scopedUsers = scopedUsers.filter((user) => user.departmentId === request.departmentId);
        }

        return scopedUsers.map((user) => user.id);
    }

    static async applyScopes(
        potentialApprovers: string[],
        scope: ContextScope | ContextScope[],
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        let scopedIds = Array.from(new Set(potentialApprovers));
        if (scopedIds.length === 0) return [];
        const { request } = context;
        const effectiveScopes = this.normalizeScopes(scope).filter((value) => value !== ContextScope.GLOBAL);
        const cache = this.getRuntimeCache(context);
        const now = new Date();

        if (effectiveScopes.length === 0) {
            return scopedIds;
        }

        for (const currentScope of effectiveScopes) {
            if (scopedIds.length === 0) break;

            if (currentScope === ContextScope.SAME_AREA) {
                if (!request.areaId) return [];
                const areaKey = `scope:same-area:${request.areaId}:${scopedIds.slice().sort().join(',')}`;
                const users = cache.has(areaKey)
                    ? cache.get(areaKey)
                    : await prisma.user.findMany({
                        where: {
                            id: { in: scopedIds },
                            areaId: request.areaId,
                            activated: true,
                            deletedAt: null
                        },
                        select: { id: true }
                    });
                cache.set(areaKey, users);
                scopedIds = users.map((u) => u.id);
                continue;
            }

            if (currentScope === ContextScope.SAME_DEPARTMENT) {
                if (!request.departmentId) return [];
                const deptKey = `scope:same-dept:${request.departmentId}:${scopedIds.slice().sort().join(',')}`;
                const users = cache.has(deptKey)
                    ? cache.get(deptKey)
                    : await prisma.user.findMany({
                        where: {
                            id: { in: scopedIds },
                            departmentId: request.departmentId,
                            activated: true,
                            deletedAt: null
                        },
                        select: { id: true }
                    });
                cache.set(deptKey, users);
                scopedIds = users.map((u) => u.id);
                continue;
            }

            if (currentScope === ContextScope.SAME_PROJECT) {
                if (!request.projectId) return [];
                const projectKey = `scope:same-project:${request.projectId}:${scopedIds.slice().sort().join(',')}`;
                const projectMembers = cache.has(projectKey)
                    ? cache.get(projectKey)
                    : await prisma.userProject.findMany({
                        where: {
                            userId: { in: scopedIds },
                            projectId: request.projectId,
                            startDate: { lte: now },
                            OR: [{ endDate: null }, { endDate: { gte: now } }]
                        },
                        select: { userId: true }
                    });
                cache.set(projectKey, projectMembers);
                scopedIds = projectMembers.map((up) => up.userId);
            }
        }

        return scopedIds;
    }

    static async generateSubFlows(
        policies: WorkflowPolicy[],
        context: WorkflowExecutionContext
    ): Promise<WorkflowResolution> {
        const startedAtMs = Date.now();
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
        resolution.watchers = this.deduplicateWatchers(resolution.watchers);

        const elapsedMs = Date.now() - startedAtMs;
        console.info(`[WORKFLOW_PERF] generateSubFlows built ${resolution.subFlows.length} sub-flows in ${elapsedMs}ms`);
        return resolution;
    }

    private static async buildSubFlow(
        policy: WorkflowPolicy,
        context: WorkflowExecutionContext
    ): Promise<WorkflowSubFlow> {
        const sortedSteps = this.sortPolicySteps(policy.steps);
        const stepMap = new Map<number, WorkflowSubFlowStep[]>();

        for (const [index, step] of sortedSteps.entries()) {
            const parallelGroupId = step.parallelGroupId ?? `seq-${step.sequence}`;
            const isAutoApproveStep = !!step.autoApprove;
            const safetyResult = isAutoApproveStep
                ? {
                    resolverIds: [] as string[],
                    stepSkipped: false,
                    fallbackUsed: false
                }
                : await this.resolveStepWithSafety(step, context);
            const stepState = isAutoApproveStep
                ? WorkflowStepRuntimeState.AUTO_APPROVED
                : (safetyResult.stepSkipped
                    ? WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL
                    : WorkflowStepRuntimeState.READY);

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

    static async resolveWatcher(
        watcher: WorkflowWatcher,
        context: WorkflowExecutionContext
    ): Promise<string[]> {
        let watcherIds: string[] = [];
        switch (watcher.resolver) {
            case ResolverType.SPECIFIC_USER:
                watcherIds = watcher.resolverId ? [watcher.resolverId] : [];
                break;

            case ResolverType.ROLE:
                if (watcher.resolverId) {
                    watcherIds = await this.resolveUsersByRole(
                        watcher.resolverId,
                        context,
                        watcher.scope
                    );
                }
                break;

            case ResolverType.DEPARTMENT_MANAGER:
                watcherIds = await this.resolveDepartmentManagers(context);
                break;

            case ResolverType.LINE_MANAGER:
                watcherIds = await this.resolveLineManagers(context);
                break;

            default:
                watcherIds = [];
                break;
        }

        return await this.applyScopes(watcherIds, watcher.scope, context);
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
            ...(supervisors ?? []).map(s => s.userId),
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

        const defaultRoleEntries = new Map<string, { id: string; name: string }>();
        if (defaultRole) defaultRoleEntries.set(defaultRole.id, defaultRole);

        // If no specific project context, only return default roles to avoid cross-project leakage.
        // Project roles will be captured when evaluating their respective contexts.
        if (!projectId) return Array.from(defaultRoleEntries.values()).sort((a, b) => a.id.localeCompare(b.id));

        const projectRoleEntries = new Map<string, { id: string; name: string }>();

        for (const entry of userProjects) {
            if (!entry.role || !entry.project) continue;
            if (entry.project.archived || entry.project.status !== 'ACTIVE' as any) continue;
            projectRoleEntries.set(entry.role.id, { id: entry.role.id, name: entry.role.name });
        }

        // Return the union of default role and project roles.
        // A user's profile role remains active even when assigned to a project.
        const allRoleEntries = new Map([...defaultRoleEntries, ...projectRoleEntries]);
        return Array.from(allRoleEntries.values()).sort((a, b) => a.id.localeCompare(b.id));
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

    private static mapAreaConstraintToScopes(constraint: string | null): ContextScope[] {
        const normalized = (constraint ?? '').trim().toUpperCase();
        if (!normalized) return [ContextScope.GLOBAL];

        const scopes = new Set<ContextScope>();
        const addArea = () => scopes.add(ContextScope.SAME_AREA);
        const addProject = () => scopes.add(ContextScope.SAME_PROJECT);
        const addDepartment = () => scopes.add(ContextScope.SAME_DEPARTMENT);

        if (
            normalized.includes('SAME_AS_SUBJECT') ||
            normalized.includes('SAME_SUBJECT') ||
            normalized.includes('SAME_SUBJECT_AREA') ||
            normalized.includes('SUBJECT_AREA') ||
            normalized.includes('SAME_AS_REQUESTER') ||
            normalized.includes('SAME_AS_REQUESTER_AREA') ||
            normalized.includes('SAME_REQUESTER_AREA') ||
            normalized.includes('REQUESTER_AREA') ||
            normalized.includes('SAME_AREA')
        ) addArea();

        if (
            normalized.includes('SAME_AS_PROJECT') ||
            normalized.includes('SAME_PROJECT') ||
            normalized.includes('PROJECT')
        ) addProject();

        if (
            normalized.includes('SAME_DEPARTMENT') ||
            normalized.includes('SAME_AS_DEPARTMENT') ||
            normalized.includes('DEPARTMENT')
        ) addDepartment();

        if (scopes.size === 0) return [ContextScope.GLOBAL];
        return Array.from(scopes);
    }

    private static normalizeScopes(scope: ContextScope | ContextScope[] | undefined | null): ContextScope[] {
        if (!scope) return [ContextScope.GLOBAL];
        const list = Array.isArray(scope) ? scope : [scope];
        const normalized = Array.from(new Set(list));
        return normalized.length > 0 ? normalized : [ContextScope.GLOBAL];
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
                leaveStatus: LeaveStatus.REJECTED,
                subFlowStates
            };
        }

        const allApproved = subFlowStates.length > 0 && subFlowStates.every((entry) => entry.state === WorkflowSubFlowRuntimeState.APPROVED);
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

    static aggregateOutcomeFromApprovalSteps(steps: Array<{ id: string; approverId: string; status: number; sequenceOrder: number | null; policyId?: string | null; projectId?: string | null }>): WorkflowAggregateOutcome {
        const policyGroups = new Map<string, Array<{ id: string; approverId: string; status: number; sequenceOrder: number | null; policyId?: string | null; projectId?: string | null }>>();

        for (const step of steps) {
            const pid = step.policyId || `LEGACY_PROJECT_${step.projectId || 'GLOBAL'}`;
            if (!policyGroups.has(pid)) policyGroups.set(pid, []);
            policyGroups.get(pid)!.push(step);
        }

        const subFlows: WorkflowSubFlow[] = [];

        for (const [pid, policySteps] of policyGroups.entries()) {
            const stepMap = new Map<number, WorkflowSubFlowStep[]>();

            for (const step of policySteps) {
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

                if (!stepMap.has(sequence)) stepMap.set(sequence, []);
                stepMap.get(sequence)!.push(runtimeStep);
            }

            subFlows.push({
                id: `subflow:${pid}`,
                policyId: pid,
                origin: {
                    policyId: pid,
                    policyName: pid.startsWith('LEGACY') ? 'Legacy Project Policy' : 'Workflow Policy',
                    requestType: 'LEAVE_REQUEST',
                    projectId: policySteps[0].projectId || undefined
                },
                stepGroups: Array.from(stepMap.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([sequence, groupedSteps]) => ({ sequence, steps: groupedSteps })),
                watcherUserIds: []
            });
        }

        const syntheticResolution: WorkflowResolution = {
            resolvers: [],
            watchers: [],
            subFlows
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
            const key = `${resolver.policyId ?? 'NO_POLICY'}:${resolver.step ?? 'NO_STEP'}:${resolver.userId}`;
            if (!seen.has(key)) {
                seen.set(key, resolver);
            }
        }
        return Array.from(seen.values());
    }

    private static deduplicateWatchers<T extends { userId: string; type: ResolverType }>(
        watchers: T[]
    ): T[] {
        const seen = new Map<string, T>();
        for (const watcher of watchers) {
            if (!seen.has(watcher.userId)) {
                seen.set(watcher.userId, watcher);
            }
        }
        return Array.from(seen.values());
    }

    private static getRuntimeCache(context: WorkflowExecutionContext): Map<string, any> {
        const ctx = context as WorkflowExecutionContext & { [key: string]: any };
        if (!ctx[this.RUNTIME_CACHE_KEY]) {
            ctx[this.RUNTIME_CACHE_KEY] = new Map<string, any>();
        }
        return ctx[this.RUNTIME_CACHE_KEY] as Map<string, any>;
    }
}
