import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';

jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
        approvalRule: { findMany: jest.fn() },
        watcherRule: { findMany: jest.fn() },
        project: { findFirst: jest.fn(), findUnique: jest.fn() },
        userProject: { findMany: jest.fn(), findFirst: jest.fn() },
        departmentSupervisor: { findMany: jest.fn() },
        department: { findUnique: jest.fn() }
    }
}));

import prisma from '../../lib/prisma';
const prismaMock = prisma as any;

describe('Workflow Engine Runtime - Task 4.1', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('matches approval rules using requester default role + active project roles (UNION)', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'user-1',
            companyId: 'company-1',
            areaId: 'area-1',
            contractTypeId: null,
            department: { name: 'Engineering' },
            defaultRole: { id: 'role-default', name: 'Engineer' }
        });

        prismaMock.project.findFirst.mockResolvedValue({
            id: 'project-1',
            type: 'CLIENT'
        });

        prismaMock.userProject.findMany.mockResolvedValue([
            {
                role: { id: 'role-project', name: 'Tech Lead' },
                project: { archived: false, status: 'active' }
            }
        ]);

        prismaMock.approvalRule.findMany.mockResolvedValue([
            {
                id: 'ar-default',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                projectType: 'CLIENT',
                subjectRoleId: 'role-default',
                subjectAreaId: null,
                approverRoleId: 'approver-default',
                approverAreaConstraint: null,
                sequenceOrder: 1,
                subjectRole: { id: 'role-default', name: 'Engineer' }
            },
            {
                id: 'ar-project',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                projectType: 'CLIENT',
                subjectRoleId: 'role-project',
                subjectAreaId: null,
                approverRoleId: 'approver-project',
                approverAreaConstraint: null,
                sequenceOrder: 1,
                subjectRole: { id: 'role-project', name: 'Tech Lead' }
            },
            {
                id: 'ar-unmatched',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                projectType: 'CLIENT',
                subjectRoleId: 'role-other',
                subjectAreaId: null,
                approverRoleId: 'approver-other',
                approverAreaConstraint: null,
                sequenceOrder: 1,
                subjectRole: { id: 'role-other', name: 'Other' }
            }
        ]);

        prismaMock.watcherRule.findMany.mockResolvedValue([]);

        const policies = await WorkflowResolverService.findMatchingPolicies('user-1', 'project-1', 'LEAVE_REQUEST');
        const resolverIds = policies.flatMap((policy) => policy.steps.map((step) => step.resolverId));

        expect(policies).toHaveLength(2);
        expect(resolverIds).toContain('approver-default');
        expect(resolverIds).toContain('approver-project');
        expect(resolverIds).not.toContain('approver-other');
    });

    it('supports explicit Any matching and filters inactive related entities', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'user-2',
            companyId: 'company-1',
            areaId: null,
            contractTypeId: 'ct-full-time',
            department: { name: 'Operations' },
            defaultRole: { id: 'role-staff', name: 'Staff' }
        });

        prismaMock.userProject.findMany.mockResolvedValue([]);

        prismaMock.approvalRule.findMany.mockResolvedValue([
            {
                id: 'ar-any',
                companyId: 'company-1',
                requestType: 'ANY',
                projectType: 'ALL',
                subjectRoleId: 'role-any',
                subjectAreaId: null,
                approverRoleId: 'approver-any',
                approverAreaConstraint: null,
                sequenceOrder: 1,
                subjectRole: { id: 'role-any', name: 'Any' }
            },
            // duplicated row to validate deterministic dedupe
            {
                id: 'ar-any',
                companyId: 'company-1',
                requestType: 'ANY',
                projectType: 'ALL',
                subjectRoleId: 'role-any',
                subjectAreaId: null,
                approverRoleId: 'approver-any',
                approverAreaConstraint: null,
                sequenceOrder: 1,
                subjectRole: { id: 'role-any', name: 'Any' }
            }
        ]);

        prismaMock.watcherRule.findMany.mockResolvedValue([
            {
                id: 'wr-all',
                requestType: 'ALL',
                projectType: null,
                roleId: null,
                teamId: null,
                projectId: null,
                contractTypeId: null,
                role: null,
                team: null,
                project: null,
                contractType: null
            },
            {
                id: 'wr-archived-project',
                requestType: 'LEAVE_REQUEST',
                projectType: 'ALL',
                roleId: null,
                teamId: null,
                projectId: 'project-archived',
                contractTypeId: null,
                role: null,
                team: null,
                project: { id: 'project-archived', archived: true, status: 'active' },
                contractType: null
            }
        ]);

        const policies = await WorkflowResolverService.findMatchingPolicies('user-2', null, 'LEAVE_REQUEST');

        expect(policies).toHaveLength(1);
        expect(policies[0].trigger.requestType).toBe('ANY');
        expect(policies[0].steps).toHaveLength(1);
        expect(policies[0].watchers).toHaveLength(1);
    });
});
