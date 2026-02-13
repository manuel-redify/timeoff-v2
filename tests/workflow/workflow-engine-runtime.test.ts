import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';
import {
    ContextScope,
    ResolverType,
    WorkflowMasterRuntimeState,
    WorkflowStepRuntimeState
} from '../../lib/types/workflow';
import { LeaveStatus } from '../../lib/generated/prisma/enums';

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

describe('Workflow Engine Runtime - Task 4.2', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('builds independent sub-flows per policy-role context with deterministic step ordering', async () => {
        const policies: any[] = [
            {
                id: 'policy-b',
                name: 'Policy B',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Tech Lead', projectType: 'CLIENT' },
                steps: [
                    { sequence: 2, resolver: ResolverType.SPECIFIC_USER, resolverId: 'user-3', scope: ContextScope.GLOBAL, action: 'APPROVE' },
                    { sequence: 1, resolver: ResolverType.SPECIFIC_USER, resolverId: 'user-2', scope: ContextScope.GLOBAL, action: 'APPROVE', parallelGroupId: 'g-1' },
                    { sequence: 1, resolver: ResolverType.SPECIFIC_USER, resolverId: 'user-1', scope: ContextScope.GLOBAL, action: 'APPROVE', parallelGroupId: 'g-1' }
                ],
                watchers: [],
                isActive: true,
                companyId: 'company-1',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                id: 'policy-a',
                name: 'Policy A',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Engineer', projectType: 'CLIENT' },
                steps: [
                    { sequence: 1, resolver: ResolverType.SPECIFIC_USER, resolverId: 'user-4', scope: ContextScope.GLOBAL, action: 'APPROVE' }
                ],
                watchers: [],
                isActive: true,
                companyId: 'company-1',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        const context: any = {
            company: { id: 'company-1' },
            request: {
                userId: 'requester-1',
                requestType: 'LEAVE_REQUEST',
                projectId: 'project-1',
                departmentId: 'dept-1'
            }
        };

        const resolution = await WorkflowResolverService.generateSubFlows(policies, context);

        expect(resolution.subFlows).toHaveLength(2);
        expect(resolution.subFlows[0].policyId).toBe('policy-a');
        expect(resolution.subFlows[1].policyId).toBe('policy-b');

        const policyBSubFlow = resolution.subFlows.find((flow) => flow.policyId === 'policy-b')!;
        expect(policyBSubFlow.stepGroups).toHaveLength(2);
        expect(policyBSubFlow.stepGroups[0].sequence).toBe(1);
        expect(policyBSubFlow.stepGroups[0].steps.map((step) => step.resolverId)).toEqual(['user-1', 'user-2']);
        expect(policyBSubFlow.stepGroups[1].sequence).toBe(2);
        expect(policyBSubFlow.stepGroups[1].steps[0].resolverId).toBe('user-3');
    });

    it('marks self-approval as skipped and injects fallback during sub-flow generation', async () => {
        const policies: any[] = [
            {
                id: 'policy-self',
                name: 'Self Approval Policy',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Engineer' },
                steps: [
                    { sequence: 1, resolver: ResolverType.SPECIFIC_USER, resolverId: 'requester-1', scope: ContextScope.GLOBAL, action: 'APPROVE' }
                ],
                watchers: [],
                isActive: true,
                companyId: 'company-1',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        prismaMock.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

        const context: any = {
            company: { id: 'company-1' },
            request: {
                userId: 'requester-1',
                requestType: 'LEAVE_REQUEST',
                projectId: null,
                departmentId: null
            }
        };

        const resolution = await WorkflowResolverService.generateSubFlows(policies, context);
        const step = resolution.subFlows[0].stepGroups[0].steps[0];

        expect(step.skipped).toBe(true);
        expect(step.fallbackUsed).toBe(true);
        expect(step.resolverIds).toEqual(['admin-1']);
        expect(resolution.resolvers.map((resolver) => resolver.userId)).toContain('admin-1');
    });
});

describe('Workflow Engine Runtime - Task 4.3', () => {
    it('returns PENDING/NEW when at least one sub-flow still has required pending steps', () => {
        const resolution: any = {
            resolvers: [],
            watchers: [],
            subFlows: [
                {
                    id: 'sf-1',
                    policyId: 'policy-1',
                    origin: { policyId: 'policy-1', policyName: 'Policy 1', requestType: 'LEAVE_REQUEST' },
                    watcherUserIds: [],
                    stepGroups: [
                        {
                            sequence: 1,
                            steps: [
                                {
                                    id: 's1',
                                    sequence: 1,
                                    parallelGroupId: 'g-1',
                                    resolver: ResolverType.SPECIFIC_USER,
                                    scope: ContextScope.GLOBAL,
                                    action: 'APPROVE',
                                    state: WorkflowStepRuntimeState.APPROVED,
                                    resolverIds: ['u-1'],
                                    fallbackUsed: false,
                                    skipped: false
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'sf-2',
                    policyId: 'policy-2',
                    origin: { policyId: 'policy-2', policyName: 'Policy 2', requestType: 'LEAVE_REQUEST' },
                    watcherUserIds: [],
                    stepGroups: [
                        {
                            sequence: 1,
                            steps: [
                                {
                                    id: 's2',
                                    sequence: 1,
                                    parallelGroupId: 'g-2',
                                    resolver: ResolverType.SPECIFIC_USER,
                                    scope: ContextScope.GLOBAL,
                                    action: 'APPROVE',
                                    state: WorkflowStepRuntimeState.PENDING,
                                    resolverIds: ['u-2'],
                                    fallbackUsed: false,
                                    skipped: false
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const outcome = WorkflowResolverService.aggregateOutcome(resolution);

        expect(outcome.masterState).toBe(WorkflowMasterRuntimeState.PENDING);
        expect(outcome.leaveStatus).toBe(LeaveStatus.NEW);
    });

    it('returns REJECTED when any sub-flow contains a rejected required step', () => {
        const resolution: any = {
            resolvers: [],
            watchers: [],
            subFlows: [
                {
                    id: 'sf-1',
                    policyId: 'policy-1',
                    origin: { policyId: 'policy-1', policyName: 'Policy 1', requestType: 'LEAVE_REQUEST' },
                    watcherUserIds: [],
                    stepGroups: [
                        {
                            sequence: 1,
                            steps: [
                                {
                                    id: 's1',
                                    sequence: 1,
                                    parallelGroupId: 'g-1',
                                    resolver: ResolverType.SPECIFIC_USER,
                                    scope: ContextScope.GLOBAL,
                                    action: 'APPROVE',
                                    state: WorkflowStepRuntimeState.REJECTED,
                                    resolverIds: ['u-1'],
                                    fallbackUsed: false,
                                    skipped: false
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'sf-2',
                    policyId: 'policy-2',
                    origin: { policyId: 'policy-2', policyName: 'Policy 2', requestType: 'LEAVE_REQUEST' },
                    watcherUserIds: [],
                    stepGroups: []
                }
            ]
        };

        const outcome = WorkflowResolverService.aggregateOutcome(resolution);

        expect(outcome.masterState).toBe(WorkflowMasterRuntimeState.REJECTED);
        expect(outcome.leaveStatus).toBe(LeaveStatus.REJECTED);
    });

    it('returns APPROVED only when all required steps are closed (including skipped/auto-approved)', () => {
        const resolution: any = {
            resolvers: [],
            watchers: [],
            subFlows: [
                {
                    id: 'sf-1',
                    policyId: 'policy-1',
                    origin: { policyId: 'policy-1', policyName: 'Policy 1', requestType: 'LEAVE_REQUEST' },
                    watcherUserIds: [],
                    stepGroups: [
                        {
                            sequence: 1,
                            steps: [
                                {
                                    id: 's1',
                                    sequence: 1,
                                    parallelGroupId: 'g-1',
                                    resolver: ResolverType.SPECIFIC_USER,
                                    scope: ContextScope.GLOBAL,
                                    action: 'APPROVE',
                                    state: WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL,
                                    resolverIds: ['u-1'],
                                    fallbackUsed: false,
                                    skipped: true
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'sf-2',
                    policyId: 'policy-2',
                    origin: { policyId: 'policy-2', policyName: 'Policy 2', requestType: 'LEAVE_REQUEST' },
                    watcherUserIds: [],
                    stepGroups: [
                        {
                            sequence: 1,
                            steps: [
                                {
                                    id: 's2',
                                    sequence: 1,
                                    parallelGroupId: 'g-2',
                                    resolver: ResolverType.SPECIFIC_USER,
                                    scope: ContextScope.GLOBAL,
                                    action: 'APPROVE',
                                    state: WorkflowStepRuntimeState.AUTO_APPROVED,
                                    resolverIds: ['u-2'],
                                    fallbackUsed: false,
                                    skipped: false
                                },
                                {
                                    id: 'notify-only',
                                    sequence: 1,
                                    parallelGroupId: 'g-3',
                                    resolver: ResolverType.SPECIFIC_USER,
                                    scope: ContextScope.GLOBAL,
                                    action: 'NOTIFY',
                                    state: WorkflowStepRuntimeState.PENDING,
                                    resolverIds: ['u-3'],
                                    fallbackUsed: false,
                                    skipped: false
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const outcome = WorkflowResolverService.aggregateOutcome(resolution);

        expect(outcome.masterState).toBe(WorkflowMasterRuntimeState.APPROVED);
        expect(outcome.leaveStatus).toBe(LeaveStatus.APPROVED);
    });
});
