import { describe, it, expect, vi, beforeEach } from 'vitest';
// Aggiornati i percorsi per puntare alla cartella lib/ dal percorso tests/workflow/
import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';
import prisma from '../../lib/prisma';
import {
    ResolverType,
    ContextScope,
    WorkflowStepRuntimeState,
    WorkflowExecutionContext,
    WorkflowMasterRuntimeState
} from '../../lib/types/workflow';

// 1. Setup del Mocking profondo per Prisma
vi.mock('../../lib/prisma', () => ({
    default: {
        user: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
        workflow: { findMany: vi.fn() },
        userProject: { findMany: vi.fn() },
        departmentSupervisor: { findMany: vi.fn() },
        department: { findUnique: vi.fn() },
        project: { findFirst: vi.fn() }
    }
}));

describe('WorkflowResolverService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Suite A: Context & Role Explosion (findMatchingPolicies)', () => {
        it('Scenario 1: Global Only Request (No ProjectId) - Esplode i contesti su tutti i progetti attivi', async () => {
            // Mock utente: ha un ruolo di default "Developer" ed è su due progetti
            (prisma.user.findFirst as any).mockResolvedValue({
                id: 'req-user-1',
                companyId: 'comp-1',
                departmentId: 'dept-1',
                activated: true,
                defaultRole: { id: 'role-dev', name: 'Developer' },
                projects: [
                    { projectId: 'proj-alpha', roleId: 'role-dev', project: { type: 'SOFTWARE' } },
                    { projectId: 'proj-beta', roleId: 'role-lead', project: { type: 'CONSULTING' } }
                ]
            });

            // Mock Workflow: Una policy per i Developer (sia globale che su progetti)
            (prisma.workflow.findMany as any).mockResolvedValue([{
                id: 'wf-developer',
                name: 'Standard Developer Policy',
                companyId: 'comp-1',
                isActive: true,
                rules: {
                    requestTypes: ['LEAVE_REQUEST'],
                    subjectRoles: ['role-dev'], // Matcher per il ruolo
                    projectTypes: [], // Valida per tutti i tipi
                    steps: []
                }
            }]);

            // AZIONE: Simuliamo la richiesta ferie standard, in cui il projectId è null
            const policies = await WorkflowResolverService.findMatchingPolicies('req-user-1', null, 'LEAVE_REQUEST');

            // VERIFICA: L'engine deve generare 3 istanze della policy (1 globale + 1 per proj-alpha + 1 per proj-beta)
            // Questo perché il ruolo "Developer" fa parte del roleUniverse di tutti e 3 i contesti!
            expect(policies).toHaveLength(3);

            const policyIds = policies.map(p => p.id);
            expect(policyIds).toContain('wf-developer:global');
            expect(policyIds).toContain('wf-developer:proj-alpha');
            expect(policyIds).toContain('wf-developer:proj-beta');
        });

        it('Scenario 2: Project Specific Request - Ignora gli altri progetti', async () => {
            (prisma.user.findFirst as any).mockResolvedValue({
                id: 'req-user-1',
                companyId: 'comp-1',
                departmentId: 'dept-1',
                activated: true,
                defaultRole: { id: 'role-dev', name: 'Developer' },
                projects: [
                    { projectId: 'proj-alpha', roleId: 'role-dev', project: { type: 'SOFTWARE' } },
                    { projectId: 'proj-beta', roleId: 'role-lead', project: { type: 'CONSULTING' } }
                ]
            });

            (prisma.workflow.findMany as any).mockResolvedValue([{
                id: 'wf-developer',
                name: 'Standard Developer Policy',
                rules: {
                    requestTypes: ['LEAVE_REQUEST'],
                    subjectRoles: ['role-dev'],
                    projectTypes: []
                }
            }]);

            // AZIONE: Richiesta specifica per proj-alpha
            const policies = await WorkflowResolverService.findMatchingPolicies('req-user-1', 'proj-alpha', 'LEAVE_REQUEST');

            // VERIFICA: Valuta SOLO il contesto Globale (che c'è sempre) e il progetto Alpha. Beta è ignorato.
            expect(policies).toHaveLength(2);
            const policyIds = policies.map(p => p.id);
            expect(policyIds).not.toContain('wf-developer:proj-beta');
        });
    });

    describe('Suite B: Scope Intersection (applyScopes)', () => {
        const dummyContext = {
            request: { userId: 'req-1', areaId: 'area-A', departmentId: 'dept-A', projectId: 'proj-A' },
            company: { id: 'comp-1' }
        } as unknown as WorkflowExecutionContext;

        it('Scenario 1: SAME_AREA + SAME_PROJECT', async () => {
            const potentialApprovers = ['user-1', 'user-2', 'user-3'];

            // Il mock della cache di getRequesterDetails
            (prisma.user.findUnique as any).mockResolvedValue({ areaId: 'area-A', departmentId: 'dept-A' });

            // Mock filtro Area: rimangono solo user-1 e user-2
            (prisma.user.findMany as any).mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]);

            // Mock filtro Progetto: rimane SOLO user-1
            (prisma.userProject.findMany as any).mockResolvedValue([{ userId: 'user-1' }]);

            const result = await WorkflowResolverService.applyScopes(
                potentialApprovers,
                [ContextScope.SAME_AREA, ContextScope.SAME_PROJECT],
                dummyContext
            );

            // VERIFICA: L'intersezione rigorosa (AND) lascia solo user-1
            expect(result).toHaveLength(1);
            expect(result).toContain('user-1');
        });

        it('Scenario 2: Empty Intersection (Nessun approvatore valido)', async () => {
            const potentialApprovers = ['user-1', 'user-2'];
            (prisma.user.findUnique as any).mockResolvedValue({ areaId: 'area-A', departmentId: 'dept-A' });

            // Mock filtro dipartimento: nessuno appartiene allo stesso dipartimento
            (prisma.user.findMany as any).mockResolvedValue([]);

            const result = await WorkflowResolverService.applyScopes(
                potentialApprovers,
                [ContextScope.SAME_DEPARTMENT],
                dummyContext
            );

            expect(result).toHaveLength(0);
        });
    });

    describe('Suite C: Fallback Hierarchy & Safety (resolveStepWithSafety)', () => {
        const dummyContext = {
            request: { userId: 'req-user', departmentId: 'dept-1' },
            company: { id: 'comp-1' }
        } as unknown as WorkflowExecutionContext;

        it('Scenario 1: Manager Fallback Activation', async () => {
            // Bypassiamo resolveStep e mockiamo un array vuoto (nessun approvatore primario trovato)
            vi.spyOn(WorkflowResolverService, 'resolveStep').mockResolvedValue([]);

            // Mock dei dipartimenti (Livello 1 Fallback)
            (prisma.user.findUnique as any).mockResolvedValue({ departmentId: 'dept-1' });
            (prisma.departmentSupervisor.findMany as any).mockResolvedValue([{ userId: 'mgr-1' }]);
            (prisma.department.findUnique as any).mockResolvedValue({ bossId: 'mgr-2' });
            (prisma.user.findMany as any).mockResolvedValue([{ id: 'mgr-1' }, { id: 'mgr-2' }]); // active managers

            const step: any = { resolver: ResolverType.ROLE, resolverId: 'some-role', autoApprove: false };

            const result = await WorkflowResolverService.resolveStepWithSafety(step, dummyContext);

            // VERIFICA: Ha usato i manager e segnalato il fallback
            expect(result.resolverIds).toEqual(['mgr-1', 'mgr-2']);
            expect(result.fallbackUsed).toBe(true);
            expect(result.stepSkipped).toBe(false);
        });

        it('Scenario 2: Admin Fallback Activation (Nessun manager disponibile)', async () => {
            vi.spyOn(WorkflowResolverService, 'resolveStep').mockResolvedValue([]);
            (prisma.user.findUnique as any).mockResolvedValue({ departmentId: 'dept-1' });

            // Mock Manager: Nessuno trovato
            (prisma.departmentSupervisor.findMany as any).mockResolvedValue([]);
            (prisma.department.findUnique as any).mockResolvedValue({ bossId: null });

            // Mock Admin (Livello 2 Fallback)
            (prisma.user.findMany as any).mockResolvedValue([{ id: 'admin-1' }, { id: 'admin-2' }]);

            const step: any = { resolver: ResolverType.ROLE, autoApprove: false };
            const result = await WorkflowResolverService.resolveStepWithSafety(step, dummyContext);

            // VERIFICA: Ha scalato fino agli Admin
            expect(result.resolverIds).toEqual(['admin-1', 'admin-2']);
            expect(result.fallbackUsed).toBe(true);
        });

        it('Scenario 3: Self-Approval Skip (Conflitto di interessi con Auto-Approve)', async () => {
            // L'unico approvatore primario trovato è il richiedente stesso
            vi.spyOn(WorkflowResolverService, 'resolveStep').mockResolvedValue(['req-user']);

            // Lo step consente di auto-approvarsi
            const step: any = { resolver: ResolverType.ROLE, autoApprove: true };
            const result = await WorkflowResolverService.resolveStepWithSafety(step, dummyContext);

            // VERIFICA: Array vuoto ma stepSkipped: true
            expect(result.resolverIds).toHaveLength(0);
            expect(result.stepSkipped).toBe(true);
            expect(result.fallbackUsed).toBe(false);
        });

        it('Scenario 4: Self-Approval Fallback (Conflitto senza Auto-Approve)', async () => {
            vi.spyOn(WorkflowResolverService, 'resolveStep').mockResolvedValue(['req-user']);
            (prisma.user.findUnique as any).mockResolvedValue({ departmentId: 'dept-1' });

            // Fallback restituisce un admin
            (prisma.departmentSupervisor.findMany as any).mockResolvedValue([]);
            (prisma.department.findUnique as any).mockResolvedValue(null);
            (prisma.user.findMany as any).mockResolvedValue([{ id: 'admin-1' }]);

            // Lo step richiede per forza un'altra persona
            const step: any = { resolver: ResolverType.ROLE, autoApprove: false };
            const result = await WorkflowResolverService.resolveStepWithSafety(step, dummyContext);

            // VERIFICA: Ha rifiutato il richiedente e forzato il fallback
            expect(result.resolverIds).toEqual(['admin-1']);
            expect(result.stepSkipped).toBe(false);
            expect(result.fallbackUsed).toBe(true);
        });
    });

    describe('Suite D: Sub-Flow Generation', () => {
        it('Scenario 1: Deduplication degli approvatori nello stesso step', async () => {
            const dummyContext = {
                request: { userId: 'req-user', projectId: 'proj-1' },
                company: { id: 'comp-1' }
            } as unknown as WorkflowExecutionContext;

            // Simuliamo due policy separate che casualmente portano alla stessa persona per lo step 1
            const policies: any[] = [
                { id: 'pol-1', trigger: {}, steps: [{ sequence: 1, resolver: ResolverType.ROLE }], watchers: [] },
                { id: 'pol-2', trigger: {}, steps: [{ sequence: 1, resolver: ResolverType.ROLE }], watchers: [] }
            ];

            vi.spyOn(WorkflowResolverService, 'resolveStepWithSafety').mockResolvedValue({
                resolverIds: ['user-1'], stepSkipped: false, fallbackUsed: false
            });

            const resolution = await WorkflowResolverService.generateSubFlows(policies, dummyContext);

            // VERIFICA: Nonostante 2 policy puntino a 'user-1', nell'array master dei resolver appare una volta sola per policy.
            // La deduplicazione lavora sulla tupla [PolicyId + Sequence + UserId]
            expect(resolution.resolvers.filter(r => r.userId === 'user-1')).toHaveLength(2); // 1 per pol-1, 1 per pol-2

            // Verifica che i subflow siano stati generati e indipendenti
            expect(resolution.subFlows).toHaveLength(2);
        });

        it('Scenario 2: Indipendenza dei Sub-Flow e sequenzialità degli step', async () => {
            const dummyContext = {
                request: { userId: 'req-user', projectId: 'proj-1' },
                company: { id: 'comp-1' }
            } as unknown as WorkflowExecutionContext;

            const policies: any[] = [
                {
                    id: 'pol-1', trigger: {}, watchers: [],
                    steps: [
                        { sequence: 2, resolver: ResolverType.ROLE, resolverId: 'role-b' },
                        { sequence: 1, resolver: ResolverType.ROLE, resolverId: 'role-a' } // Disordinati volutamente
                    ]
                },
                {
                    id: 'pol-2', trigger: {}, watchers: [],
                    steps: [
                        { sequence: 1, resolver: ResolverType.DEPARTMENT_MANAGER }
                    ]
                }
            ];

            // Mockiamo resolveStepWithSafety per restituire utenti diversi in base al resolver/role
            vi.spyOn(WorkflowResolverService, 'resolveStepWithSafety').mockImplementation(async (step: any) => {
                if (step.resolverId === 'role-a') return { resolverIds: ['user-a'], stepSkipped: false, fallbackUsed: false };
                if (step.resolverId === 'role-b') return { resolverIds: ['user-b'], stepSkipped: false, fallbackUsed: false };
                if (step.resolver === ResolverType.DEPARTMENT_MANAGER) return { resolverIds: ['manager-1'], stepSkipped: false, fallbackUsed: false };
                return { resolverIds: [], stepSkipped: false, fallbackUsed: false };
            });

            const resolution = await WorkflowResolverService.generateSubFlows(policies, dummyContext);

            // 1. Indipendenza: ci devono essere esattamente 2 subflow separati
            expect(resolution.subFlows).toHaveLength(2);

            const subFlow1 = resolution.subFlows.find(sf => sf.policyId === 'pol-1');
            const subFlow2 = resolution.subFlows.find(sf => sf.policyId === 'pol-2');

            expect(subFlow1).toBeDefined();
            expect(subFlow2).toBeDefined();

            // 2. Sequenzialità SubFlow 1: deve avere 2 step group, riordinati correttamente (1 poi 2)
            expect(subFlow1!.stepGroups).toHaveLength(2);
            expect(subFlow1!.stepGroups[0].sequence).toBe(1);
            expect(subFlow1!.stepGroups[1].sequence).toBe(2);
            expect(subFlow1!.stepGroups[0].steps[0].resolverIds).toEqual(['user-a']);
            expect(subFlow1!.stepGroups[1].steps[0].resolverIds).toEqual(['user-b']);

            // 3. Sequenzialità SubFlow 2: deve avere 1 solo step, indipendente dall'altro flusso
            expect(subFlow2!.stepGroups).toHaveLength(1);
            expect(subFlow2!.stepGroups[0].sequence).toBe(1);
            expect(subFlow2!.stepGroups[0].steps[0].resolverIds).toEqual(['manager-1']);

            // 4. Mappatura Resolvers (usati per l'invio delle notifiche e l'avanzamento degli step)
            // Deve contenere esattamente: user-a (step 1), user-b (step 2), manager-1 (step 1)
            expect(resolution.resolvers).toHaveLength(3);

            const userAResolver = resolution.resolvers.find(r => r.userId === 'user-a');
            expect(userAResolver!.step).toBe(1);
            expect(userAResolver!.policyId).toBe('pol-1');

            const userBResolver = resolution.resolvers.find(r => r.userId === 'user-b');
            expect(userBResolver!.step).toBe(2);
            expect(userBResolver!.policyId).toBe('pol-1');

            const managerResolver = resolution.resolvers.find(r => r.userId === 'manager-1');
            expect(managerResolver!.step).toBe(1);
            expect(managerResolver!.policyId).toBe('pol-2');
        });
    });

    describe('Suite E: Trigger Filters (Contract, Department, Project Type)', () => {
        it('Scenario 1: Scarta policy se il Contract Type dell\'utente non corrisponde', async () => {
            (prisma.user.findFirst as any).mockResolvedValue({
                id: 'req-user',
                companyId: 'comp-1',
                contractTypeId: 'contract-part-time', // L'utente è Part-Time
                activated: true,
                projects: []
            });

            (prisma.workflow.findMany as any).mockResolvedValue([{
                id: 'wf-full-time',
                isActive: true,
                rules: {
                    requestTypes: ['LEAVE_REQUEST'],
                    contractTypes: ['contract-full-time'] // La policy richiede Full-Time
                }
            }]);

            const policies = await WorkflowResolverService.findMatchingPolicies('req-user', null, 'LEAVE_REQUEST');

            // VERIFICA: La policy deve essere scartata
            expect(policies).toHaveLength(0);
        });

        it('Scenario 2: Scarta policy se il Project Type non corrisponde', async () => {
            (prisma.user.findFirst as any).mockResolvedValue({
                id: 'req-user',
                companyId: 'comp-1',
                activated: true,
                projects: [
                    { projectId: 'proj-A', project: { type: 'MAINTENANCE' }, roleId: 'role-dev' }
                ]
            });

            (prisma.workflow.findMany as any).mockResolvedValue([{
                id: 'wf-project',
                isActive: true,
                rules: {
                    requestTypes: ['LEAVE_REQUEST'],
                    projectTypes: ['SOFTWARE_DEV'] // La policy richiede tipo SOFTWARE_DEV
                }
            }]);

            const policies = await WorkflowResolverService.findMatchingPolicies('req-user', null, 'LEAVE_REQUEST');

            // VERIFICA: Poiché l'unico progetto attivo è MAINTENANCE, la policy viene ignorata
            expect(policies).toHaveLength(0);
        });
    });

    describe('Suite F: Master Outcome Aggregation (aggregateOutcome)', () => {
        it('Scenario 1: Se un singolo Sub-Flow è REJECTED, il Master diventa REJECTED', () => {
            const resolution: any = {
                subFlows: [
                    { id: 'sub-1', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.APPROVED }] }] },
                    { id: 'sub-2', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.REJECTED }] }] },
                    { id: 'sub-3', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.PENDING }] }] }
                ]
            };

            const outcome = WorkflowResolverService.aggregateOutcome(resolution);

            // VERIFICA: Il "REJECTED" vince su tutto (Veto System)
            expect(outcome.masterState).toBe(WorkflowMasterRuntimeState.REJECTED);
        });

        it('Scenario 2: Se tutti i Sub-Flow sono APPROVED, il Master diventa APPROVED', () => {
            const resolution: any = {
                subFlows: [
                    { id: 'sub-1', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.APPROVED }] }] },
                    { id: 'sub-2', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.AUTO_APPROVED }] }] },
                    { id: 'sub-3', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL }] }] }
                ]
            };

            const outcome = WorkflowResolverService.aggregateOutcome(resolution);

            // VERIFICA: Auto-Approved e Skipped contano come validi per chiudere il flow
            expect(outcome.masterState).toBe(WorkflowMasterRuntimeState.APPROVED);
        });

        it('Scenario 3: Se c\'è anche solo un PENDING e nessun REJECTED, il Master resta PENDING', () => {
            const resolution: any = {
                subFlows: [
                    { id: 'sub-1', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.APPROVED }] }] },
                    { id: 'sub-2', stepGroups: [{ steps: [{ action: 'APPROVE', state: WorkflowStepRuntimeState.PENDING }] }] }
                ]
            };

            const outcome = WorkflowResolverService.aggregateOutcome(resolution);

            expect(outcome.masterState).toBe(WorkflowMasterRuntimeState.PENDING);
        });
    });

    describe('Suite G: Watchers Resolution', () => {
        it('Scenario 1: Estrazione corretta dei Watcher dai flussi', async () => {
            const dummyContext = {
                request: { userId: 'req-user', projectId: 'proj-1' },
                company: { id: 'comp-1' }
            } as unknown as WorkflowExecutionContext;

            const policies: any[] = [
                {
                    id: 'pol-1', trigger: {}, steps: [],
                    watchers: [{ resolver: ResolverType.SPECIFIC_USER, resolverId: 'watcher-1', scope: [ContextScope.GLOBAL] }]
                }
            ];

            const resolution = await WorkflowResolverService.generateSubFlows(policies, dummyContext);

            // VERIFICA: Il watcher deve essere estratto e inserito negli array master, ignorando i resolver di approvazione vuoti
            expect(resolution.watchers).toHaveLength(1);
            expect(resolution.watchers[0].userId).toBe('watcher-1');
            expect(resolution.subFlows[0].watcherUserIds).toContain('watcher-1');
        });
    });
});