import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';
import { ContextScope, ResolverType } from '../../lib/types/workflow';

jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findFirst: jest.fn(), findMany: jest.fn() },
        approvalRule: { findMany: jest.fn() },
        watcherRule: { findMany: jest.fn() },
        userProject: { findMany: jest.fn() }
    }
}));

import prisma from '../../lib/prisma';
const prismaMock = prisma as any;

describe('Workflow Resolver - project role precedence', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prismaMock.user.findMany.mockResolvedValue([]);
    });

    it('uses project role instead of default role when active project role exists', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'req-1',
            companyId: 'company-1',
            areaId: null,
            contractTypeId: null,
            department: { name: 'Engineering' },
            defaultRole: { id: 'role-default', name: 'Frontend Developer' },
            projects: [
                {
                    projectId: 'project-1',
                    project: { id: 'project-1', type: 'PROJECT', archived: false, status: 'active' }
                }
            ]
        });

        prismaMock.approvalRule.findMany.mockResolvedValue([
            {
                id: 'rule-default',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                projectType: 'PROJECT',
                subjectRoleId: 'role-default',
                subjectRole: { id: 'role-default', name: 'Frontend Developer' },
                subjectAreaId: null,
                approverRoleId: 'role-fe-tl',
                approverAreaConstraint: 'SAME_PROJECT',
                sequenceOrder: 1
            },
            {
                id: 'rule-project',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                projectType: 'PROJECT',
                subjectRoleId: 'role-project',
                subjectRole: { id: 'role-project', name: 'Backend Developer' },
                subjectAreaId: null,
                approverRoleId: 'role-be-tl',
                approverAreaConstraint: 'SAME_PROJECT',
                sequenceOrder: 1
            }
        ]);

        prismaMock.watcherRule.findMany.mockResolvedValue([]);
        prismaMock.userProject.findMany.mockImplementation(({ where }: any) => {
            if (!where?.projectId) return [];
            if (where.projectId === 'project-1') {
                return [
                    {
                        role: { id: 'role-project', name: 'Backend Developer' },
                        project: { archived: false, status: 'active' }
                    }
                ];
            }
            return [];
        });

        const policies = await WorkflowResolverService.findMatchingPolicies('req-1', 'project-1', 'LEAVE_REQUEST');
        const approverRoleIds = policies.flatMap((policy) => policy.steps.map((step) => step.resolverId));

        expect(approverRoleIds).toContain('role-be-tl');
        expect(approverRoleIds).not.toContain('role-fe-tl');
    });

    it('falls back to default role when no active project role exists', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'req-1',
            companyId: 'company-1',
            areaId: null,
            contractTypeId: null,
            department: { name: 'Engineering' },
            defaultRole: { id: 'role-default', name: 'Backend Developer' },
            projects: [
                {
                    projectId: 'project-1',
                    project: { id: 'project-1', type: 'PROJECT', archived: false, status: 'active' }
                }
            ]
        });

        prismaMock.approvalRule.findMany.mockResolvedValue([
            {
                id: 'rule-default',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                projectType: 'PROJECT',
                subjectRoleId: 'role-default',
                subjectRole: { id: 'role-default', name: 'Backend Developer' },
                subjectAreaId: null,
                approverRoleId: 'role-be-tl',
                approverAreaConstraint: 'SAME_PROJECT',
                sequenceOrder: 1
            }
        ]);

        prismaMock.watcherRule.findMany.mockResolvedValue([]);
        prismaMock.userProject.findMany.mockResolvedValue([]);

        const policies = await WorkflowResolverService.findMatchingPolicies('req-1', 'project-1', 'LEAVE_REQUEST');
        const approverRoleIds = policies.flatMap((policy) => policy.steps.map((step) => step.resolverId));

        expect(approverRoleIds).toContain('role-be-tl');
    });

    it('prefers explicit SAME_PROJECT project-role approvers over default-role fallback', async () => {
        prismaMock.user.findMany.mockImplementation(({ where }: any) => {
            const ids = where?.id?.in;
            if (Array.isArray(ids)) {
                return ids.map((id: string) => ({ id, areaId: null, departmentId: null }));
            }
            return [];
        });
        prismaMock.userProject.findMany.mockImplementation(({ where }: any) => {
            if (where?.roleId === 'role-be-tl' && where?.projectId === 'project-1') {
                return [{ userId: 'be-tech-lead' }];
            }

            if (
                where?.projectId === 'project-1' &&
                where?.user?.defaultRoleId === 'role-be-tl'
            ) {
                return [{ userId: 'be-pm-default-role' }];
            }

            if (where?.userId?.in && where?.projectId === 'project-1') {
                return where.userId.in.map((id: string) => ({ userId: id }));
            }

            return [];
        });

        const resolution = await WorkflowResolverService.generateSubFlows(
            [{
                id: 'policy-1',
                name: 'Backend Approval',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Backend Developer', projectId: 'project-1' },
                steps: [{
                    sequence: 1,
                    resolver: ResolverType.ROLE,
                    resolverId: 'role-be-tl',
                    scope: ContextScope.SAME_PROJECT,
                    action: 'APPROVE'
                }],
                watchers: [],
                isActive: true,
                companyId: 'company-1',
                createdAt: new Date(),
                updatedAt: new Date()
            }],
            {
                request: {
                    userId: 'requester-1',
                    requestType: 'LEAVE_REQUEST',
                    projectId: 'project-1'
                },
                user: {} as any,
                company: {
                    id: 'company-1',
                    roles: [],
                    departments: [],
                    projects: [],
                    contractTypes: []
                }
            }
        );

        expect(resolution.resolvers.map((resolver: any) => resolver.userId)).toEqual(['be-tech-lead']);
    });

    it('uses default-role fallback for SAME_PROJECT when no explicit project-role assignee exists', async () => {
        prismaMock.user.findMany.mockImplementation(({ where }: any) => {
            const ids = where?.id?.in;
            if (Array.isArray(ids)) {
                return ids.map((id: string) => ({ id, areaId: null, departmentId: null }));
            }
            return [];
        });
        prismaMock.userProject.findMany.mockImplementation(({ where }: any) => {
            if (where?.roleId === 'role-be-tl' && where?.projectId === 'project-1') {
                return [];
            }

            if (
                where?.projectId === 'project-1' &&
                where?.user?.defaultRoleId === 'role-be-tl'
            ) {
                return [{ userId: 'be-pm-default-role' }];
            }

            if (where?.userId?.in && where?.projectId === 'project-1') {
                return where.userId.in.map((id: string) => ({ userId: id }));
            }

            return [];
        });

        const resolution = await WorkflowResolverService.generateSubFlows(
            [{
                id: 'policy-1',
                name: 'Backend Approval',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Backend Developer', projectId: 'project-1' },
                steps: [{
                    sequence: 1,
                    resolver: ResolverType.ROLE,
                    resolverId: 'role-be-tl',
                    scope: ContextScope.SAME_PROJECT,
                    action: 'APPROVE'
                }],
                watchers: [],
                isActive: true,
                companyId: 'company-1',
                createdAt: new Date(),
                updatedAt: new Date()
            }],
            {
                request: {
                    userId: 'requester-1',
                    requestType: 'LEAVE_REQUEST',
                    projectId: 'project-1'
                },
                user: {} as any,
                company: {
                    id: 'company-1',
                    roles: [],
                    departments: [],
                    projects: [],
                    contractTypes: []
                }
            }
        );

        expect(resolution.resolvers.map((resolver: any) => resolver.userId)).toEqual(['be-pm-default-role']);
    });

    it('enforces SAME_PROJECT + SAME_AREA as an intersection', async () => {
        prismaMock.user.findMany.mockImplementation(({ where }: any) => {
            const ids = where?.id?.in;
            if (Array.isArray(ids)) {
                return ids
                    .filter((id: string) => id === 'be-tech-lead-in-area')
                    .map((id: string) => ({ id, areaId: 'area-1', departmentId: null }));
            }
            return [];
        });

        prismaMock.userProject.findMany.mockImplementation(({ where }: any) => {
            if (where?.roleId === 'role-be-tl' && where?.projectId === 'project-1') {
                return [
                    { userId: 'be-tech-lead-in-area', user: { areaId: 'area-1' } },
                    { userId: 'be-tech-lead-out-area', user: { areaId: 'area-2' } }
                ];
            }

            if (where?.userId?.in && where?.projectId === 'project-1') {
                return where.userId.in.map((id: string) => ({ userId: id }));
            }

            return [];
        });

        const resolution = await WorkflowResolverService.generateSubFlows(
            [{
                id: 'policy-1',
                name: 'Backend Approval',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Backend Developer', projectId: 'project-1' },
                steps: [{
                    sequence: 1,
                    resolver: ResolverType.ROLE,
                    resolverId: 'role-be-tl',
                    scope: [ContextScope.SAME_PROJECT, ContextScope.SAME_AREA],
                    action: 'APPROVE'
                }],
                watchers: [],
                isActive: true,
                companyId: 'company-1',
                createdAt: new Date(),
                updatedAt: new Date()
            }],
            {
                request: {
                    userId: 'requester-1',
                    requestType: 'LEAVE_REQUEST',
                    projectId: 'project-1',
                    areaId: 'area-1'
                },
                user: {} as any,
                company: {
                    id: 'company-1',
                    roles: [],
                    departments: [],
                    projects: [],
                    contractTypes: []
                }
            }
        );

        expect(resolution.resolvers.map((resolver: any) => resolver.userId)).toEqual(['be-tech-lead-in-area']);
    });
});
