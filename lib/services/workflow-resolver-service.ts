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

    static async findMatchingPolicies(
        userId: string,
        projectId: string | null,
        requestType: string,
        leaveTypeId?: string
    ): Promise<WorkflowPolicy[]> {
        const startedAtMs = Date.now();
        const now = new Date();
        const normalizedRequestType = requestType.trim().toUpperCase();

        const user = await prisma.user.findFirst({
            where: { id: userId, activated: true, deletedAt: null },
            include: {
                department: { include: { supervisors: { include: { user: true } } } },
                defaultRole: true,
                area: true,
                projects: {
                    where: {
                        startDate: { lte: now },
                        OR: [{ endDate: null }, { endDate: { gte: now } }],
                        project: { archived: false, status: 'ACTIVE' as any }
                    },
                    include: { project: true, role: { select: { id: true, name: true } } }
                }
            }
        });

        if (!user) throw new Error('User not found');

        const contexts: Array<{
            id: string | null;
            type: string | null;
            roleUniverse: Array<{ id: string; name: string }>;
        }> = [];

        const globalRoles = user.defaultRole ? [{ id: user.defaultRole.id, name: user.defaultRole.name }] : [];
        contexts.push({ id: null, type: null, roleUniverse: globalRoles });

        if (projectId) {
            // Richiesta esplicita per un singolo progetto
            const projectAssignment = user.projects.find(p => p.projectId === projectId);
            if (projectAssignment) {
                const projectRoles = user.projects
                    .filter(p => p.projectId === projectId && p.roleId)
                    .map(p => ({ id: p.roleId!, name: p.role?.name || 'Project Role' }));

                contexts.push({
                    id: projectId,
                    type: projectAssignment.project.type ?? null,
                    roleUniverse: [...globalRoles, ...projectRoles]
                });
            } else {
                const standaloneProject = await prisma.project.findFirst({
                    where: { id: projectId, archived: false, status: 'ACTIVE' as any },
                    select: { id: true, type: true }
                });
                if (standaloneProject) {
                    contexts.push({ id: standaloneProject.id, type: standaloneProject.type ?? null, roleUniverse: globalRoles });
                }
            }
        } else {
            // ESPLOSIONE CONTESTI: La richiesta non specifica un progetto (es. Ferie generiche).
            // L'utente si assenta da TUTTI i suoi progetti attivi. Dobbiamo valutare le policy per ciascuno.
            const uniqueProjectIds = Array.from(new Set(user.projects.map(p => p.projectId)));

            for (const pid of uniqueProjectIds) {
                const projectAssignments = user.projects.filter(p => p.projectId === pid);
                const projectType = projectAssignments[0]?.project?.type ?? null;
                const projectRoles = projectAssignments
                    .filter(p => p.roleId)
                    .map(p => ({ id: p.roleId!, name: p.role?.name || 'Project Role' }));

                contexts.push({
                    id: pid,
                    type: projectType,
                    roleUniverse: [...globalRoles, ...projectRoles]
                });
            }
        }

        const requestTypeCandidates = new Set(this.getStringCandidates(normalizedRequestType));
        if (leaveTypeId) {
            requestTypeCandidates.add(leaveTypeId);
            requestTypeCandidates.add(leaveTypeId.trim().toUpperCase());
        }

        const workflows = await prisma.workflow.findMany({
            where: {
                companyId: user.companyId,
                isActive: true,
                OR: [
                    ...Array.from(requestTypeCandidates).map((candidate) => ({
                        rules: { path: ['requestTypes'], array_contains: [candidate] }
                    })),
                    { rules: { path: ['requestTypes'], equals: [] } }
                ]
            }
        });

        const rawPolicies: WorkflowPolicy[] = [];

        for (const context of contexts) {
            for (const wf of workflows) {
                const rules = wf.rules as unknown as WorkflowFormValues;
                const policyId = wf.id;

                const projectTypes = rules.projectTypes || [];
                const hasSpecificProjectType = projectTypes.some(pt => !this.isAnyValue(pt));
                if (hasSpecificProjectType && (!context.id || !projectTypes.includes(context.type!))) continue;

                const requestTypes = rules.requestTypes || [];
                const matchesRequestType = requestTypes.length === 0 || requestTypes.some(rt =>
                    this.isAnyValue(rt) || rt.toUpperCase() === normalizedRequestType || (leaveTypeId && rt === leaveTypeId)
                );
                if (!matchesRequestType) continue;

                const departments = rules.departments || [];
                const matchesDept = departments.length === 0 || departments.some(d =>
                    this.isAnyValue(d) || d === user.departmentId || d === user.department?.name
                );
                if (!matchesDept) continue;

                const contractTypes = rules.contractTypes || [];
                const matchesContract = contractTypes.length === 0 || contractTypes.some(ct =>
                    this.isAnyValue(ct) || ct === user.contractTypeId
                );
                if (!matchesContract) continue;

                const subjectRoles = rules.subjectRoles || [];
                const roleUniverseIds = context.roleUniverse.map(r => r.id);
                const matchingRoles = subjectRoles.filter(sr => this.isAnyValue(sr) || roleUniverseIds.includes(sr));

                const matchesRole = subjectRoles.length === 0 || matchingRoles.length > 0;
                if (!matchesRole) continue;

                const primaryRole = matchingRoles.length > 0
                    ? context.roleUniverse.find(r => matchingRoles.includes(r.id)) || context.roleUniverse[0]
                    : context.roleUniverse[0] || { id: 'ANY', name: 'ANY' };

                const steps: WorkflowStep[] = (rules.steps || []).map((step, index) => ({
                    sequence: typeof step.sequence === 'number' && step.sequence > 0 ? step.sequence : index + 1,
                    resolver: (step.resolver as ResolverType) ?? ResolverType.SPECIFIC_USER,
                    resolverId: step.resolverId,
                    scope: step.scope as ContextScope[] || [ContextScope.GLOBAL],
                    action: 'APPROVE',
                    autoApprove: step.autoApprove ?? false,
                    parallelGroupId: step.parallelGroupId
                }));

                const watchers: WorkflowWatcher[] = (rules.watchers || []).map(watcher => ({
                    resolver: watcher.resolver as ResolverType,
                    resolverId: watcher.resolverId,
                    scope: watcher.scope as ContextScope[] || [ContextScope.GLOBAL]
                }));

                rawPolicies.push({
                    id: `${policyId}:${context.id || 'global'}`,
                    name: wf.name,
                    trigger: {
                        policyId,
                        requestType: normalizedRequestType,
                        contractType: user.contractTypeId || undefined,
                        role: primaryRole.name,
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

        const sortedPolicies = rawPolicies.sort((a, b) => a.id.localeCompare(b.id));
        console.info(`[WORKFLOW_PERF] findMatchingPolicies resolved ${sortedPolicies.length} policies in ${Date.now() - startedAtMs}ms`);
        return sortedPolicies;
    }

    /**
     * Recupera le info anagrafiche reali del richiedente per non dipendere dai dati (spesso nulli) del payload API.
     */
    private static async getRequesterDetails(context: WorkflowExecutionContext) {
        const cache = this.getRuntimeCache(context);
        const key = `requester-details:${context.request.userId}`;
        if (cache.has(key)) return cache.get(key);

        const user = await prisma.user.findUnique({
            where: { id: context.request.userId },
            select: { areaId: true, departmentId: true }
        });
        cache.set(key, user);
        return user;
    }

    static async resolveStep(step: WorkflowStep, context: WorkflowExecutionContext): Promise<string[]> {
        let resolvers: string[] = [];
        switch (step.resolver) {
            case ResolverType.SPECIFIC_USER:
                if (step.resolverId) resolvers = [step.resolverId];
                break;
            case ResolverType.ROLE:
                if (step.resolverId) resolvers = await this.resolveUsersByRole(step.resolverId, context, step.scope);
                break;
            case ResolverType.DEPARTMENT_MANAGER:
                resolvers = await this.resolveDepartmentManagers(context);
                break;
            case ResolverType.LINE_MANAGER:
                resolvers = await this.resolveLineManagers(context);
                break;
        }
        return await this.applyScopes(resolvers, step.scope, context);
    }

    /**
     * Risolve i candidati base unicamente per Ruolo.
     * I filtri aggiuntivi per Area/Dept sono demandati ad applyScopes per evitare bug su payload mancanti.
     */
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

        const candidateIds = new Set<string>();

        if (hasSameProject && request.projectId) {
            // 1. Assegnazione esplicita del ruolo su questo progetto
            const projectRoleKey = `proj-role-strict:${request.projectId}:${roleId}`;
            let explicitIds: string[] = cache.get(projectRoleKey);
            if (!explicitIds) {
                const records = await prisma.userProject.findMany({
                    where: {
                        projectId: request.projectId,
                        roleId: roleId,
                        startDate: { lte: now },
                        OR: [{ endDate: null }, { endDate: { gte: now } }],
                        user: { companyId: context.company.id, activated: true, deletedAt: null }
                    },
                    select: { userId: true }
                });
                explicitIds = records.map(r => r.userId);
                cache.set(projectRoleKey, explicitIds);
            }
            explicitIds.forEach(id => candidateIds.add(id));

            // 2. Fallback: l'utente ha il ruolo globale, ed è partecipe di questo progetto
            const globalRoleInProjectKey = `global-role-in-proj:${request.projectId}:${roleId}`;
            let globalIds: string[] = cache.get(globalRoleInProjectKey);
            if (!globalIds) {
                const records = await prisma.userProject.findMany({
                    where: {
                        projectId: request.projectId,
                        startDate: { lte: now },
                        OR: [{ endDate: null }, { endDate: { gte: now } }],
                        user: { defaultRoleId: roleId, companyId: context.company.id, activated: true, deletedAt: null }
                    },
                    select: { userId: true }
                });
                globalIds = records.map(r => r.userId);
                cache.set(globalRoleInProjectKey, globalIds);
            }
            globalIds.forEach(id => candidateIds.add(id));

        } else {
            // 3. Nessun vincolo di progetto: Tutti quelli che hanno questo ruolo (globale o in qualsiasi progetto)
            const allRoleKey = `all-role-users:${context.company.id}:${roleId}`;
            let allRoleIds: string[] = cache.get(allRoleKey);
            if (!allRoleIds) {
                const records = await prisma.user.findMany({
                    where: {
                        companyId: context.company.id,
                        activated: true,
                        deletedAt: null,
                        OR: [
                            { defaultRoleId: roleId },
                            { projects: { some: { roleId: roleId, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] } } }
                        ]
                    },
                    select: { id: true }
                });
                allRoleIds = records.map(r => r.id);
                cache.set(allRoleKey, allRoleIds);
            }
            allRoleIds.forEach(id => candidateIds.add(id));
        }

        return Array.from(candidateIds);
    }

    /**
     * Intersezione garantita: Applica i filtri usando i dati anagrafici reali del richiedente.
     */
    static async applyScopes(potentialApprovers: string[], scope: ContextScope | ContextScope[], context: WorkflowExecutionContext): Promise<string[]> {
        let scopedIds = Array.from(new Set(potentialApprovers));
        if (scopedIds.length === 0) return [];

        const effectiveScopes = this.normalizeScopes(scope).filter((value) => value !== ContextScope.GLOBAL);
        if (effectiveScopes.length === 0) return scopedIds;

        const cache = this.getRuntimeCache(context);
        const now = new Date();
        const { request } = context;

        const requester = await this.getRequesterDetails(context);
        const reqAreaId = request.areaId || requester?.areaId;
        const reqDeptId = request.departmentId || requester?.departmentId;

        for (const currentScope of effectiveScopes) {
            if (scopedIds.length === 0) break;

            if (currentScope === ContextScope.SAME_AREA) {
                if (!reqAreaId) { scopedIds = []; break; } // Fail-safe
                const areaKey = `scope:area:${reqAreaId}:${scopedIds.sort().join(',')}`;
                if (!cache.has(areaKey)) {
                    const validUsers = await prisma.user.findMany({
                        where: { id: { in: scopedIds }, areaId: reqAreaId, activated: true, deletedAt: null },
                        select: { id: true }
                    });
                    cache.set(areaKey, validUsers.map(u => u.id));
                }
                scopedIds = cache.get(areaKey);
            }
            else if (currentScope === ContextScope.SAME_DEPARTMENT) {
                if (!reqDeptId) { scopedIds = []; break; } // Fail-safe
                const deptKey = `scope:dept:${reqDeptId}:${scopedIds.sort().join(',')}`;
                if (!cache.has(deptKey)) {
                    const validUsers = await prisma.user.findMany({
                        where: { id: { in: scopedIds }, departmentId: reqDeptId, activated: true, deletedAt: null },
                        select: { id: true }
                    });
                    cache.set(deptKey, validUsers.map(u => u.id));
                }
                scopedIds = cache.get(deptKey);
            }
            else if (currentScope === ContextScope.SAME_PROJECT && request.projectId) {
                const projectKey = `scope:proj:${request.projectId}:${scopedIds.sort().join(',')}`;
                if (!cache.has(projectKey)) {
                    const validMembers = await prisma.userProject.findMany({
                        where: { userId: { in: scopedIds }, projectId: request.projectId, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
                        select: { userId: true }
                    });
                    cache.set(projectKey, validMembers.map(u => u.userId));
                }
                scopedIds = cache.get(projectKey);
            }
        }
        return scopedIds;
    }

    private static async resolveDepartmentManagers(context: WorkflowExecutionContext): Promise<string[]> {
        const requester = await this.getRequesterDetails(context);
        const reqDeptId = context.request.departmentId || requester?.departmentId;
        if (!reqDeptId) return [];

        const supervisors = await prisma.departmentSupervisor.findMany({
            where: { departmentId: reqDeptId },
            include: { user: true }
        });
        const department = await prisma.department.findUnique({
            where: { id: reqDeptId },
            include: { boss: true }
        });

        const managerIds = [
            ...(supervisors ?? []).map(s => s.userId),
            ...(department?.bossId ? [department.bossId] : [])
        ];

        const activeManagers = await prisma.user.findMany({
            where: { id: { in: managerIds }, activated: true, deletedAt: null },
            select: { id: true }
        });
        return activeManagers.map(u => u.id);
    }

    private static async resolveLineManagers(context: WorkflowExecutionContext): Promise<string[]> {
        return this.resolveDepartmentManagers(context);
    }

    static async getCompanyAdminFallback(companyId: string, requesterId: string): Promise<string[]> {
        const admins = await prisma.user.findMany({
            where: { companyId, isAdmin: true, activated: true, deletedAt: null, id: { not: requesterId } },
            select: { id: true },
            orderBy: [{ name: 'asc' }, { lastname: 'asc' }]
        });
        return admins.map(admin => admin.id);
    }

    static async getDepartmentManagerFallback(departmentId: string, requesterId: string): Promise<string[]> {
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
        ].filter(id => id !== requesterId); // Escludiamo subito il richiedente

        if (managerIds.length === 0) return []; // Nessun manager trovato

        const activeManagers = await prisma.user.findMany({
            where: { id: { in: managerIds }, activated: true, deletedAt: null },
            select: { id: true }
        });

        return activeManagers.map(u => u.id);
    }

    static async getFallbackApprover(context: WorkflowExecutionContext): Promise<string[]> {
        const { company, request } = context;
        const requester = await this.getRequesterDetails(context);
        const reqDeptId = request.departmentId || requester?.departmentId;

        // Livello 1: Department Manager
        if (reqDeptId) {
            const deptManagers = await this.getDepartmentManagerFallback(reqDeptId, request.userId);
            if (deptManagers.length > 0) {
                return deptManagers;
            }
        }

        // Livello 2: Company Admin (se non ha dipartimento o se i manager sono assenti/uguali al richiedente)
        return this.getCompanyAdminFallback(company.id, request.userId);
    }

    static isSelfApproval(approverId: string, requesterId: string): boolean {
        return approverId === requesterId;
    }

    static async applySelfApprovalSafety(
        resolverIds: string[],
        context: WorkflowExecutionContext,
        step: WorkflowStep
    ): Promise<{ validResolvers: string[]; requiresFallback: boolean; stepSkipped: boolean }> {
        const validResolvers = resolverIds.filter(id => !this.isSelfApproval(id, context.request.userId));
        const allResolversWereSelf = validResolvers.length === 0 && resolverIds.length > 0;
        const stepSkipped = allResolversWereSelf && !!step.autoApprove;
        const requiresFallback = validResolvers.length === 0 && !stepSkipped;

        return { validResolvers, requiresFallback, stepSkipped };
    }

    static async resolveStepWithSafety(
        step: WorkflowStep,
        context: WorkflowExecutionContext
    ): Promise<{ resolverIds: string[]; stepSkipped: boolean; fallbackUsed: boolean }> {
        const resolverIds = await this.resolveStep(step, context);
        const safetyResult = await this.applySelfApprovalSafety(resolverIds, context, step);

        if (safetyResult.stepSkipped) return { resolverIds: [], stepSkipped: true, fallbackUsed: false };

        let finalResolvers = safetyResult.validResolvers;
        let fallbackUsed = false;

        // Se l'intersezione degli scope ha svuotato la lista, o l'unico approvatore era il richiedente
        if (safetyResult.requiresFallback || finalResolvers.length === 0) {
            // Chiamata all'unica catena di fallback: Manager -> Admin
            const fallbackApprovers = await this.getFallbackApprover(context);
            finalResolvers = fallbackApprovers;
            fallbackUsed = true;
        }

        return { resolverIds: finalResolvers, stepSkipped: false, fallbackUsed };
    }

    static async generateSubFlows(policies: WorkflowPolicy[], context: WorkflowExecutionContext): Promise<WorkflowResolution> {
        const startedAtMs = Date.now();
        const resolution: WorkflowResolution = { resolvers: [], watchers: [], subFlows: [] };
        const sortedPolicies = [...policies].sort((a, b) => a.id.localeCompare(b.id));

        const policyResolutions = await Promise.all(sortedPolicies.map(async (policy) => {
            const policyContext = {
                ...context,
                request: { ...context.request, projectId: policy.trigger.projectId || context.request.projectId }
            };

            const subFlow = await this.buildSubFlow(policy, policyContext);
            const resolvers: Array<{ userId: string; type: ResolverType; step: number; policyId: string }> = [];

            for (const group of subFlow.stepGroups) {
                for (const step of group.steps) {
                    for (const resolverId of step.resolverIds) {
                        resolvers.push({ userId: resolverId, type: step.resolver, step: step.sequence, policyId: subFlow.policyId });
                    }
                }
            }

            const watcherBatches = await Promise.all(policy.watchers.map(async (watcher) => {
                const watcherIds = await this.resolveWatcher(watcher, policyContext);
                return watcherIds
                    .filter((id) => !this.isSelfApproval(id, context.request.userId))
                    .map((userId) => ({ userId, type: watcher.resolver }));
            }));

            return { subFlow, resolvers, watchers: watcherBatches.flat() };
        }));

        for (const entry of policyResolutions) {
            resolution.subFlows.push(entry.subFlow);
            resolution.resolvers.push(...entry.resolvers);
            resolution.watchers.push(...entry.watchers);
        }

        if (resolution.resolvers.length === 0) {
            const lastResortApprovers = await this.getCompanyAdminFallback(context.company.id, context.request.userId);
            for (const approverId of lastResortApprovers) {
                resolution.resolvers.push({ userId: approverId, type: ResolverType.SPECIFIC_USER, step: 999, policyId: 'SAFETY_NET' });
            }
        }

        resolution.subFlows = resolution.subFlows.map((subFlow) => ({
            ...subFlow,
            watcherUserIds: Array.from(new Set(resolution.watchers.map(w => w.userId))).sort()
        }));

        resolution.resolvers = this.deduplicateResolvers(resolution.resolvers);
        resolution.watchers = this.deduplicateWatchers(resolution.watchers);

        console.info(`[WORKFLOW_PERF] generateSubFlows built ${resolution.subFlows.length} sub-flows in ${Date.now() - startedAtMs}ms`);
        return resolution;
    }

    private static async buildSubFlow(policy: WorkflowPolicy, context: WorkflowExecutionContext): Promise<WorkflowSubFlow> {
        const sortedSteps = this.sortPolicySteps(policy.steps);
        const stepMap = new Map<number, WorkflowSubFlowStep[]>();

        // ESECUZIONE IN PARALLELO DEGLI STEP:
        // Invece di un ciclo for...of sequenziale, risolviamo tutti gli step contemporaneamente
        const resolvedSteps = await Promise.all(sortedSteps.map(async (step, index) => {
            const parallelGroupId = step.parallelGroupId ?? `seq-${step.sequence}`;
            const isAutoApproveStep = !!step.autoApprove;

            const safetyResult = isAutoApproveStep
                ? { resolverIds: [] as string[], stepSkipped: false, fallbackUsed: false }
                : await this.resolveStepWithSafety(step, context);

            const stepState = isAutoApproveStep
                ? WorkflowStepRuntimeState.AUTO_APPROVED
                : (safetyResult.stepSkipped ? WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL : WorkflowStepRuntimeState.READY);

            const subFlowStep: WorkflowSubFlowStep = {
                id: `${policy.id}:step:${step.sequence}:${index}`,
                sequence: step.sequence,
                parallelGroupId,
                resolver: step.resolver,
                resolverId: step.resolverId,
                scope: step.scope,
                action: step.action,
                state: stepState,
                resolverIds: [...safetyResult.resolverIds].sort(),
                fallbackUsed: safetyResult.fallbackUsed,
                skipped: safetyResult.stepSkipped
            };

            return subFlowStep;
        }));

        // Popoliamo la mappa raggruppando per sequenza
        for (const subFlowStep of resolvedSteps) {
            if (!stepMap.has(subFlowStep.sequence)) stepMap.set(subFlowStep.sequence, []);
            stepMap.get(subFlowStep.sequence)!.push(subFlowStep);
        }

        const stepGroups: WorkflowSubFlowStepGroup[] = Array.from(stepMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([sequence, steps]) => ({
                sequence,
                steps: steps.sort((l, r) => {
                    const groupCmp = l.parallelGroupId.localeCompare(r.parallelGroupId);
                    if (groupCmp !== 0) return groupCmp;
                    const resCmp = l.resolver.localeCompare(r.resolver);
                    if (resCmp !== 0) return resCmp;
                    return (l.resolverId ?? '').localeCompare(r.resolverId ?? '');
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

    static async resolveWatcher(watcher: WorkflowWatcher, context: WorkflowExecutionContext): Promise<string[]> {
        let watcherIds: string[] = [];
        switch (watcher.resolver) {
            case ResolverType.SPECIFIC_USER:
                watcherIds = watcher.resolverId ? [watcher.resolverId] : []; break;
            case ResolverType.ROLE:
                if (watcher.resolverId) watcherIds = await this.resolveUsersByRole(watcher.resolverId, context, watcher.scope); break;
            case ResolverType.DEPARTMENT_MANAGER:
                watcherIds = await this.resolveDepartmentManagers(context); break;
            case ResolverType.LINE_MANAGER:
                watcherIds = await this.resolveLineManagers(context); break;
        }
        return await this.applyScopes(watcherIds, watcher.scope, context);
    }

    static aggregateOutcome(resolution: WorkflowResolution): WorkflowAggregateOutcome {
        const subFlowStates = resolution.subFlows.map((subFlow) => ({
            subFlowId: subFlow.id,
            state: this.getSubFlowRuntimeState(subFlow)
        }));

        const hasRejected = subFlowStates.some(e => e.state === WorkflowSubFlowRuntimeState.REJECTED);
        if (hasRejected) {
            return { masterState: WorkflowMasterRuntimeState.REJECTED, leaveStatus: LeaveStatus.REJECTED, subFlowStates };
        }

        const allApproved = subFlowStates.length > 0 && subFlowStates.every(e => e.state === WorkflowSubFlowRuntimeState.APPROVED);
        if (allApproved) {
            return { masterState: WorkflowMasterRuntimeState.APPROVED, leaveStatus: LeaveStatus.APPROVED, subFlowStates };
        }

        return { masterState: WorkflowMasterRuntimeState.PENDING, leaveStatus: LeaveStatus.NEW, subFlowStates };
    }

    static aggregateOutcomeFromApprovalSteps(steps: Array<{ id: string; approverId: string; status: number; sequenceOrder: number | null; policyId?: string | null; projectId?: string | null }>): WorkflowAggregateOutcome {
        const policyGroups = new Map<string, Array<any>>();

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
                stepGroups: Array.from(stepMap.entries()).sort((a, b) => a[0] - b[0]).map(([sequence, groupedSteps]) => ({ sequence, steps: groupedSteps })),
                watcherUserIds: []
            });
        }

        return this.aggregateOutcome({ resolvers: [], watchers: [], subFlows });
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

    private static deduplicateResolvers<T extends { userId: string; type: ResolverType; step?: number; policyId?: string }>(resolvers: T[]): T[] {
        const seen = new Map<string, T>();
        for (const resolver of resolvers) {
            const key = `${resolver.policyId ?? 'NO_POLICY'}:${resolver.step ?? 'NO_STEP'}:${resolver.userId}`;
            if (!seen.has(key)) seen.set(key, resolver);
        }
        return Array.from(seen.values());
    }

    private static deduplicateWatchers<T extends { userId: string; type: ResolverType }>(watchers: T[]): T[] {
        const seen = new Map<string, T>();
        for (const watcher of watchers) {
            if (!seen.has(watcher.userId)) seen.set(watcher.userId, watcher);
        }
        return Array.from(seen.values());
    }

    private static getRuntimeCache(context: WorkflowExecutionContext): Map<string, any> {
        const ctx = context as WorkflowExecutionContext & { [key: string]: any };
        if (!ctx[this.RUNTIME_CACHE_KEY]) ctx[this.RUNTIME_CACHE_KEY] = new Map<string, any>();
        return ctx[this.RUNTIME_CACHE_KEY] as Map<string, any>;
    }

    private static normalizeScopes(scope: ContextScope | ContextScope[] | undefined | null): ContextScope[] {
        if (!scope) return [ContextScope.GLOBAL];
        const list = Array.isArray(scope) ? scope : [scope];
        const normalized = Array.from(new Set(list));
        return normalized.length > 0 ? normalized : [ContextScope.GLOBAL];
    }

    private static isAnyValue(value: string | null | undefined): boolean {
        if (!value) return true;
        return this.ANY_MARKERS.has(value.trim().toUpperCase());
    }

    private static getStringCandidates(value: string): string[] {
        const candidates = new Set([value, 'ALL', 'ANY', '*']);
        if (value === 'LEAVE') candidates.add('LEAVE_REQUEST');
        if (value === 'LEAVE_REQUEST') candidates.add('LEAVE');
        return Array.from(candidates);
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
}