import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';
import {
    ContextScope,
    ResolverType
} from '../../lib/types/workflow';

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

describe('Workflow Engine - Multi-Project Routing Verification', () => {
    const requesterId = 'f0b9225a-fa3a-44b7-bf9f-32ab1399b74e';
    const requesterRoleId = '139d87ef-a341-4949-822a-264a06bfecad';
    const p1Id = '46d97001-4fe8-4079-97d1-4a979061bf71';
    const p2Id = '4abd0a30-0f80-4a8c-8ab6-45b48a9904ce';
    const tlRoleId = '610a49c8-796a-4a83-b2ef-e49dc556b884';
    const p1TlId = '993fdd49-57e9-4314-992e-7c047cd3f903';
    const p2TlId = '051fffc3-e80c-4128-9616-4f9bd70aa4d4';

    beforeEach(() => {
        jest.clearAllMocks();
        prismaMock.departmentSupervisor.findMany.mockResolvedValue([]);
        prismaMock.department.findUnique.mockResolvedValue({ bossId: null });
        prismaMock.user.findMany.mockResolvedValue([]);
    });

    it('verifies that P2 TL is correctly resolved for P2 policy context', async () => {
        // 1. Mock Requester
        prismaMock.user.findFirst.mockResolvedValue({
            id: requesterId,
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            defaultRole: { id: requesterRoleId, name: 'Employee' },
            projects: [
                {
                    projectId: p1Id,
                    project: { id: p1Id, type: 'PROJECT', archived: false, status: 'ACTIVE' }
                },
                {
                    projectId: p2Id,
                    project: { id: p2Id, type: 'PROJECT', archived: false, status: 'ACTIVE' }
                }
            ]
        });

        // 2. Mock Role Collection & Resolver Resolution
        prismaMock.userProject.findMany.mockImplementation((params: any) => {
            const where = params.where;
            // Role collection step
            if (where.userId === requesterId && where.roleId && typeof where.roleId === 'object' && 'not' in where.roleId) {
                return [
                    {
                        role: { id: requesterRoleId, name: 'Employee' },
                        project: { id: p1Id, archived: false, status: 'ACTIVE' },
                        projectId: p1Id
                    },
                    {
                        role: { id: requesterRoleId, name: 'Employee' },
                        project: { id: p2Id, archived: false, status: 'ACTIVE' },
                        projectId: p2Id
                    }
                ];
            }

            // applyScope SAME_PROJECT check by candidate users
            if (where.userId && typeof where.userId === 'object' && Array.isArray(where.userId.in)) {
                if (where.projectId === p1Id) {
                    return where.userId.in.includes(p1TlId) ? [{ userId: p1TlId }] : [];
                }
                if (where.projectId === p2Id) {
                    return where.userId.in.includes(p2TlId) ? [{ userId: p2TlId }] : [];
                }
            }

            // Resolver step for TL role (checks OR condition for roleId/defaultRole)
            const roleMatch = where.OR && (where.OR[0].roleId === tlRoleId || where.OR[1].user.defaultRoleId === tlRoleId);
            const isTlLookup = where.roleId === tlRoleId || roleMatch;

            if (isTlLookup) {
                if (where.projectId === p1Id) {
                    return [{ userId: p1TlId, user: { id: p1TlId, areaId: 'area-1', departmentId: 'dept-1' } }];
                }
                if (where.projectId === p2Id) {
                    return [{ userId: p2TlId, user: { id: p2TlId, areaId: 'area-1', departmentId: 'dept-1' } }];
                }
            }

            return [];
        });

        // 3. Mock Approval Rules
        prismaMock.approvalRule.findMany.mockResolvedValue([
            {
                id: 'rule-tl-approval',
                companyId: 'company-1',
                requestType: 'ANY',
                projectType: 'ANY',
                subjectRoleId: requesterRoleId,
                subjectRole: { id: requesterRoleId, name: 'Employee' },
                approverRoleId: tlRoleId,
                approverRole: { id: tlRoleId, name: 'Tech Lead' },
                approverAreaConstraint: 'SAME_PROJECT',
                sequenceOrder: 1
            }
        ]);

        prismaMock.watcherRule.findMany.mockResolvedValue([]);

        // Execution
        const policies = await WorkflowResolverService.findMatchingPolicies(requesterId, p1Id, 'LEAVE_REQUEST');

        const context: any = {
            company: { id: 'company-1' },
            request: {
                userId: requesterId,
                requestType: 'LEAVE_REQUEST',
                projectId: p1Id,
                departmentId: 'dept-1',
                areaId: 'area-1'
            }
        };

        const resolution = await WorkflowResolverService.generateSubFlows(policies, context);

        const sfP1 = resolution.subFlows.find(sf => sf.origin.projectId === p1Id);
        const sfP2 = resolution.subFlows.find(sf => sf.origin.projectId === p2Id);

        // Assertions
        expect(sfP1).toBeDefined();
        expect(sfP1?.stepGroups[0].steps[0].resolverIds).toContain(p1TlId);

        expect(sfP2).toBeDefined();
        expect(sfP2?.stepGroups[0].steps[0].resolverIds).toContain(p2TlId);
        expect(sfP2?.stepGroups[0].steps[0].fallbackUsed).toBe(false);
    });
});
