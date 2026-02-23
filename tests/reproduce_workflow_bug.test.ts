import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';
import { ResolverType } from '../types/workflow';

jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findFirst: jest.fn() },
        approvalRule: { findMany: jest.fn() },
        watcherRule: { findMany: jest.fn() },
        project: { findFirst: jest.fn() },
        userProject: { findMany: jest.fn() }
    },
}));

import prisma from '../lib/prisma';
const prismaMock = prisma as any;

describe('WorkflowResolverService Bug Reproduction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should find Tech Lead policy when requester has Tech Lead role in any project (Reproduction)', async () => {
        const mockUser: any = {
            id: 'ichigo-id',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            defaultRoleId: 'employee-role-id',
            defaultRole: { id: 'employee-role-id', name: 'Employee' },
            projects: [
                {
                    projectId: 'project-b-id',
                    project: { id: 'project-b-id', type: 'FRONTEND', status: 'ACTIVE', archived: false }
                }
            ]
        };

        prismaMock.user.findFirst.mockResolvedValue(mockUser);

        // Mock collectEffectiveRequesterRoles for null context
        prismaMock.userProject.findMany.mockImplementation(({ where }: any) => {
            if (where.projectId) {
                return Promise.resolve([
                    {
                        roleId: 'tech-lead-role-id',
                        role: { id: 'tech-lead-role-id', name: 'Tech Lead' },
                        project: { status: 'ACTIVE', archived: false }
                    }
                ]);
            }
            return Promise.resolve([]);
        });

        prismaMock.approvalRule.findMany.mockResolvedValue([
            {
                id: 'rule-tech-lead',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                subjectRoleId: 'tech-lead-role-id',
                approverRoleId: 'nick-fury-id',
                sequenceOrder: 1,
                approverAreaConstraint: null,
                projectType: 'ANY'
            },
            {
                id: 'rule-c-level',
                companyId: 'company-1',
                requestType: 'LEAVE_REQUEST',
                subjectRoleId: 'employee-role-id',
                approverRoleId: 'manuel-id',
                sequenceOrder: 1,
                approverAreaConstraint: null,
                projectType: 'ANY'
            }
        ] as any);

        prismaMock.watcherRule.findMany.mockResolvedValue([]);

        // The request is global (projectId: null)
        const policies = await WorkflowResolverService.findMatchingPolicies('ichigo-id', null, 'LEAVE_REQUEST');

        // EXPECTATION: Both C-Level and Tech Lead policies should be found
        // ACTUAL (BUG): Only C-Level policy is found because Tech Lead role is only in Project B context
        const policyIds = policies.map(p => p.id);
        console.log('Found policies:', policyIds);

        // This is where we expect it to FAIL before the fix
        expect(policyIds).toContain(expect.stringContaining('rule-tech-lead'));
        expect(policyIds).toContain(expect.stringContaining('rule-c-level'));
    });
});
