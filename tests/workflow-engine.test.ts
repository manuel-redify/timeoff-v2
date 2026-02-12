import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';
import { ResolverType, ContextScope } from '../types/workflow';

// Mock the prisma client manually or with simple jest.mock
jest.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), count: jest.fn() },
        approvalRule: { findMany: jest.fn() },
        watcherRule: { findMany: jest.fn() },
        project: { findUnique: jest.fn() },
        userProject: { findFirst: jest.fn(), findMany: jest.fn() },
        departmentSupervisor: { findMany: jest.fn() },
        department: { findUnique: jest.fn() }
    },
}));

import prisma from '../lib/prisma';
const prismaMock = prisma as any;

describe('WorkflowResolverService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findMatchingPolicies', () => {
        const mockUser: any = {
            id: 'user-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            defaultRoleId: 'role-1',
            department: { name: 'Engineering' },
            defaultRole: { id: 'role-1', name: 'Software Engineer' }
        };

        it('should find matching policies for a simple request', async () => {
            prismaMock.user.findUnique.mockResolvedValue(mockUser);
            prismaMock.approvalRule.findMany.mockResolvedValue([
                {
                    id: 'rule-1',
                    companyId: 'company-1',
                    requestType: 'LEAVE_REQUEST',
                    subjectRoleId: 'role-1',
                    approverRoleId: 'manager-role-1',
                    sequenceOrder: 1,
                    approverAreaConstraint: null,
                    projectType: null
                }
            ] as any);
            prismaMock.watcherRule.findMany.mockResolvedValue([]);

            const policies = await WorkflowResolverService.findMatchingPolicies('user-1', null, 'LEAVE_REQUEST');

            expect(policies).toHaveLength(1);
            expect(policies[0].steps).toHaveLength(1);
            expect(policies[0].steps[0].resolver).toBe(ResolverType.ROLE);
            expect(policies[0].steps[0].resolverId).toBe('manager-role-1');
        });

        it('should throw error if user not found', async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            await expect(WorkflowResolverService.findMatchingPolicies('user-1', null, 'REQ'))
                .rejects.toThrow('User not found');
        });
    });

    describe('resolveStep', () => {
        const mockContext: any = {
            company: { id: 'company-1' },
            request: {
                userId: 'user-1',
                requestType: 'LEAVE_REQUEST',
                projectId: null,
                departmentId: 'dept-1'
            }
        };

        it('should resolve specific user', async () => {
            const step: any = {
                resolver: ResolverType.SPECIFIC_USER,
                resolverId: 'user-2',
                scope: ContextScope.GLOBAL
            };

            const resolvers = await WorkflowResolverService.resolveStep(step, mockContext);
            expect(resolvers).toEqual(['user-2']);
        });

        it('should include requester in raw resolution (filtering happens in withSafety)', async () => {
            const step: any = {
                resolver: ResolverType.SPECIFIC_USER,
                resolverId: 'user-1', // Same as context.request.userId
                scope: ContextScope.GLOBAL
            };

            const resolvers = await WorkflowResolverService.resolveStep(step, mockContext);
            expect(resolvers).toEqual(['user-1']);
        });

        it('should resolve department managers', async () => {
            const step: any = {
                resolver: ResolverType.DEPARTMENT_MANAGER,
                scope: ContextScope.GLOBAL
            };

            prismaMock.departmentSupervisor.findMany.mockResolvedValue([
                { userId: 'manager-1' }
            ] as any);
            prismaMock.department.findUnique.mockResolvedValue({ bossId: 'boss-1' } as any);
            prismaMock.user.findMany.mockResolvedValue([{ id: 'manager-1' }, { id: 'boss-1' }] as any);

            const resolvers = await WorkflowResolverService.resolveStep(step, mockContext);
            expect(resolvers).toContain('manager-1');
            expect(resolvers).toContain('boss-1');
        });
    });

    describe('isSelfApproval', () => {
        it('should return true if IDs match', () => {
            expect(WorkflowResolverService.isSelfApproval('user-1', 'user-1')).toBe(true);
        });

        it('should return false if IDs differ', () => {
            expect(WorkflowResolverService.isSelfApproval('user-1', 'user-2')).toBe(false);
        });
    });

    describe('Safety Net / Fallbacks', () => {
        const mockContext: any = {
            company: { id: 'company-1' },
            request: {
                userId: 'requester-1',
                requestType: 'LEAVE_REQUEST',
                projectId: null,
                departmentId: 'dept-1'
            }
        };

        it('should fallback to company admins when no resolvers matches (Level 3)', async () => {
            prismaMock.user.findMany.mockResolvedValue([{ id: 'admin-1' }] as any);

            const fallback = await WorkflowResolverService.getCompanyAdminFallback('company-1', 'requester-1');
            expect(fallback).toEqual(['admin-1']);
            expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    isAdmin: true,
                    id: { not: 'requester-1' }
                })
            }));
        });

        it('should return department managers as Level 2 fallback', async () => {
            prismaMock.departmentSupervisor.findMany.mockResolvedValue([{ userId: 'dept-mgr-1' }] as any);
            prismaMock.department.findUnique.mockResolvedValue({ bossId: null } as any);
            prismaMock.user.findFirst.mockResolvedValue({ id: 'dept-mgr-1', isAdmin: false } as any);
            prismaMock.user.findMany.mockResolvedValue([{ id: 'dept-mgr-1' }] as any);

            const fallback = await WorkflowResolverService.getDepartmentManagerFallback('dept-1', 'company-1', 'requester-1');
            expect(fallback).toEqual(['dept-mgr-1']);
        });
    });

    describe('resolveStepWithSafety', () => {
        const mockContext: any = {
            company: { id: 'company-1' },
            request: {
                userId: 'user-1',
                requestType: 'LEAVE_REQUEST',
                projectId: null,
                departmentId: 'dept-1'
            }
        };

        it('should use fallback if normal resolution returns no valid approvers', async () => {
            const step: any = {
                resolver: ResolverType.ROLE,
                resolverId: 'some-role',
                scope: ContextScope.GLOBAL
            };

            // Mock empty role resolution
            prismaMock.userProject.findMany.mockResolvedValue([]);

            // Mock fallback resolution (Level 3 Admin)
            prismaMock.user.findMany.mockResolvedValue([{ id: 'admin-1' }] as any);

            const result = await WorkflowResolverService.resolveStepWithSafety(step, mockContext);

            expect(result.resolverIds).toEqual(['admin-1']);
            expect(result.fallbackUsed).toBe(true);
        });

        it('should mark step as skipped if all resolvers were the requester (Self-Approval)', async () => {
            const step: any = {
                resolver: ResolverType.SPECIFIC_USER,
                resolverId: 'user-1', // Requester
                scope: ContextScope.GLOBAL
            };

            // Mock fallback resolution
            prismaMock.user.findMany.mockResolvedValue([{ id: 'admin-1' }] as any);

            const result = await WorkflowResolverService.resolveStepWithSafety(step, mockContext);

            expect(result.resolverIds).toEqual(['admin-1']);
            expect(result.stepSkipped).toBe(true);
        });
    });
});
