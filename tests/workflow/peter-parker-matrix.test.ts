import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';
import { ContextScope, ResolverType } from '../../lib/types/workflow';

jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findFirst: jest.fn(), findMany: jest.fn() },
        workflow: { findMany: jest.fn() },
        userProject: { findMany: jest.fn() },
        departmentSupervisor: { findMany: jest.fn() },
        department: { findUnique: jest.fn() },
        project: { findFirst: jest.fn() }
    }
}));

import prisma from '../../lib/prisma';
const prismaMock = prisma as any;

describe('Workflow Regression - Peter Parker Matrix', () => {
    const requesterId = 'peter-id';
    const companyId = 'company-1';
    const departmentId = 'dept-1';
    const areaId = 'area-1';
    const contractTypeId = 'ct-employee';

    const projectA = 'project-a';
    const projectB = 'project-b';
    const projectType = 'PROJECT';

    const developerRoleId = 'role-developer';
    const techLeadRoleId = 'role-tech-lead';
    const projectManagerRoleId = 'role-project-manager';

    const tonyId = 'tony-id';
    const natashaId = 'natasha-id';
    const steveId = 'steve-id';
    const pepperId = 'pepper-id';
    const rukiaId = 'rukia-id';

    beforeEach(() => {
        jest.clearAllMocks();

        prismaMock.user.findFirst.mockResolvedValue({
            id: requesterId,
            companyId,
            departmentId,
            areaId,
            contractTypeId,
            department: { name: 'Engineering' },
            defaultRole: { id: developerRoleId, name: 'Developer' },
            projects: [
                {
                    projectId: projectA,
                    project: { id: projectA, type: projectType, archived: false, status: 'ACTIVE' }
                },
                {
                    projectId: projectB,
                    project: { id: projectB, type: projectType, archived: false, status: 'ACTIVE' }
                }
            ]
        });

        prismaMock.workflow.findMany.mockResolvedValue([
            {
                id: 'wf-dev',
                name: 'Developer Workflow',
                rules: {
                    requestTypes: ['LEAVE_REQUEST'],
                    projectTypes: [projectType],
                    subjectRoles: [developerRoleId],
                    departments: [],
                    contractTypes: [contractTypeId],
                    steps: [
                        {
                            sequence: 1,
                            resolver: ResolverType.ROLE,
                            resolverId: techLeadRoleId,
                            scope: [ContextScope.SAME_AREA, ContextScope.SAME_PROJECT]
                        },
                        {
                            sequence: 2,
                            resolver: ResolverType.ROLE,
                            resolverId: projectManagerRoleId,
                            scope: [ContextScope.SAME_PROJECT]
                        }
                    ],
                    watchers: [
                        {
                            resolver: ResolverType.DEPARTMENT_MANAGER,
                            scope: [ContextScope.SAME_DEPARTMENT]
                        }
                    ]
                }
            }
        ]);

        prismaMock.departmentSupervisor.findMany.mockResolvedValue([
            { userId: rukiaId, user: { id: rukiaId } }
        ]);
        prismaMock.department.findUnique.mockResolvedValue({ bossId: null });

        prismaMock.user.findMany.mockImplementation(({ where }: any) => {
            const ids: string[] = where?.id?.in ?? [];
            if (ids.length > 0) {
                if (where.departmentId) {
                    return Promise.resolve(ids.map((id) => ({ id })));
                }
                return Promise.resolve(ids.map((id) => ({ id })));
            }
            return Promise.resolve([]);
        });

        prismaMock.userProject.findMany.mockImplementation(({ where }: any) => {
            // collectEffectiveRequesterRoles
            if (
                where?.userId === requesterId &&
                where?.roleId &&
                typeof where.roleId === 'object' &&
                'not' in where.roleId
            ) {
                if (where.projectId === projectA || where.projectId === projectB) {
                    return Promise.resolve([
                        {
                            role: { id: developerRoleId, name: 'Developer' },
                            project: { status: 'ACTIVE', archived: false }
                        }
                    ]);
                }
                return Promise.resolve([]);
            }

            // resolveUsersByRole - explicit project role assignments
            if (where?.roleId === techLeadRoleId && where?.projectId === projectA) {
                return Promise.resolve([
                    { userId: tonyId, user: { areaId, departmentId } }
                ]);
            }
            if (where?.roleId === techLeadRoleId && where?.projectId === projectB) {
                return Promise.resolve([
                    { userId: natashaId, user: { areaId, departmentId } }
                ]);
            }
            if (where?.roleId === projectManagerRoleId && where?.projectId === projectA) {
                return Promise.resolve([
                    { userId: steveId, user: { areaId, departmentId } }
                ]);
            }
            if (where?.roleId === projectManagerRoleId && where?.projectId === projectB) {
                return Promise.resolve([
                    { userId: pepperId, user: { areaId, departmentId } }
                ]);
            }

            // no default-role fallback candidates for TL/PM in project context
            if (where?.projectId && where?.user?.defaultRoleId) {
                return Promise.resolve([]);
            }

            return Promise.resolve([]);
        });
    });

    it('routes TL and PM per project and keeps Department Manager as watcher only', async () => {
        const policies = await WorkflowResolverService.findMatchingPolicies(
            requesterId,
            null,
            'LEAVE_REQUEST'
        );

        const resolution = await WorkflowResolverService.generateSubFlows(
            policies,
            {
                request: {
                    userId: requesterId,
                    requestType: 'LEAVE_REQUEST',
                    departmentId,
                    areaId
                },
                user: {} as any,
                company: {
                    id: companyId,
                    roles: [],
                    departments: [],
                    projects: [],
                    contractTypes: []
                }
            } as any
        );

        const step1Approvers = resolution.resolvers
            .filter((resolver) => resolver.step === 1)
            .map((resolver) => resolver.userId);
        const step2Approvers = resolution.resolvers
            .filter((resolver) => resolver.step === 2)
            .map((resolver) => resolver.userId);
        const allApprovers = resolution.resolvers.map((resolver) => resolver.userId);
        const allWatchers = resolution.watchers.map((watcher) => watcher.userId);

        expect(step1Approvers).toEqual(expect.arrayContaining([tonyId, natashaId]));
        expect(step2Approvers).toEqual(expect.arrayContaining([steveId, pepperId]));
        expect(allApprovers).not.toContain(rukiaId);
        expect(allWatchers).toContain(rukiaId);
    });
});

