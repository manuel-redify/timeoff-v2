import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';

jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findFirst: jest.fn() },
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
});
