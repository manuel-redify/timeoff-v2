import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';

jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findFirst: jest.fn(), findMany: jest.fn() },
        workflow: { findMany: jest.fn() },
        project: { findFirst: jest.fn() },
        userProject: { findMany: jest.fn() },
        departmentSupervisor: { findMany: jest.fn() },
        department: { findUnique: jest.fn() }
    }
}));

import prisma from '../../lib/prisma';
const prismaMock = prisma as any;

function percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx];
}

describe('Workflow Performance Benchmark', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps approval-tree generation under 200ms p95 on representative fixture', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'req-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            contractTypeId: 'contract-1',
            department: { name: 'Engineering' },
            defaultRole: { id: 'role-default', name: 'Developer' },
            projects: Array.from({ length: 5 }, (_, i) => ({
                projectId: `project-${i + 1}`,
                project: { id: `project-${i + 1}`, type: 'PROJECT', archived: false, status: 'ACTIVE' }
            }))
        });

        prismaMock.workflow.findMany.mockResolvedValue(
            Array.from({ length: 12 }, (_, i) => ({
                id: `workflow-${i + 1}`,
                name: `Workflow ${i + 1}`,
                rules: {
                    requestTypes: ['LEAVE_REQUEST'],
                    projectTypes: ['PROJECT'],
                    subjectRoles: ['ANY'],
                    departments: [],
                    contractTypes: [],
                    steps: [
                        { resolver: 'ROLE', resolverId: 'role-approver-1', scope: ['SAME_PROJECT'] },
                        { resolver: 'ROLE', resolverId: 'role-approver-2', scope: ['SAME_DEPARTMENT'] },
                    ],
                    watchers: [{ resolver: 'ROLE', resolverId: 'role-watcher', scope: ['GLOBAL'] }]
                }
            }))
        );

        prismaMock.userProject.findMany.mockImplementation(({ where }: any) => {
            if (where?.userId === 'req-1' && where?.roleId?.not !== undefined) {
                return [
                    { role: { id: 'role-project-1', name: 'Tech Lead' }, project: { id: 'project-1', archived: false, status: 'ACTIVE' } },
                    { role: { id: 'role-project-2', name: 'Architect' }, project: { id: 'project-2', archived: false, status: 'ACTIVE' } },
                ];
            }

            if (where?.roleId === 'role-approver-1' && where?.projectId) {
                return [{ userId: `approver-project-${where.projectId}`, user: { areaId: 'area-1', departmentId: 'dept-1' } }];
            }

            if (where?.roleId === 'role-watcher') {
                return [{ user: { id: 'watcher-1', areaId: 'area-1', departmentId: 'dept-1' } }];
            }

            if (where?.userId?.in && where?.projectId) {
                return where.userId.in.map((id: string) => ({ userId: id }));
            }

            return [];
        });

        prismaMock.user.findMany.mockImplementation(({ where }: any) => {
            if (where?.defaultRoleId === 'role-approver-2') {
                return [{ id: 'approver-dept-1', areaId: 'area-1', departmentId: 'dept-1' }];
            }
            if (where?.id?.in) {
                return where.id.in.map((id: string) => ({ id, areaId: 'area-1', departmentId: 'dept-1' }));
            }
            return [];
        });

        prismaMock.departmentSupervisor.findMany.mockResolvedValue([]);
        prismaMock.department.findUnique.mockResolvedValue({ bossId: null });

        const iterations = 30;
        const timings: number[] = [];

        for (let i = 0; i < iterations; i++) {
            const startedAt = Date.now();
            const policies = await WorkflowResolverService.findMatchingPolicies('req-1', null, 'LEAVE_REQUEST');
            await WorkflowResolverService.generateSubFlows(policies, {
                company: { id: 'company-1', roles: [], departments: [], projects: [], contractTypes: [] },
                user: {} as any,
                request: {
                    userId: 'req-1',
                    requestType: 'LEAVE_REQUEST',
                    projectId: 'project-1',
                    departmentId: 'dept-1',
                    areaId: 'area-1'
                }
            });
            timings.push(Date.now() - startedAt);
        }

        const p50 = percentile(timings, 50);
        const p95 = percentile(timings, 95);
        console.info(`[WORKFLOW_BENCH_TEST] p50=${p50}ms p95=${p95}ms`);

        expect(p95).toBeLessThan(200);
    });
});
