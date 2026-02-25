import { WorkflowResolverService } from '../../lib/services/workflow-resolver-service';
import {
    ContextScope,
    ResolverType,
    WorkflowMasterRuntimeState,
    WorkflowStepRuntimeState,
    WorkflowSubFlowRuntimeState
} from '../../lib/types/workflow';
import { LeaveStatus } from '../../lib/generated/prisma/enums';

jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        user: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
        workflow: { findMany: jest.fn() },
        project: { findFirst: jest.fn(), findUnique: jest.fn() },
        userProject: { findMany: jest.fn(), findFirst: jest.fn() },
        departmentSupervisor: { findMany: jest.fn() },
        department: { findUnique: jest.fn() }
    }
}));

import prisma from '../../lib/prisma';
const prismaMock = prisma as any;

describe('Workflow Auto-Approval Verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('correctly marks a step as AUTO_APPROVED when autoApprove is true', async () => {
        const policies: any[] = [
            {
                id: 'policy-auto',
                name: 'Auto Approval Policy',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Engineer' },
                steps: [
                    {
                        sequence: 1,
                        resolver: ResolverType.SPECIFIC_USER,
                        resolverId: 'approver-1',
                        scope: ContextScope.GLOBAL,
                        action: 'APPROVE',
                        autoApprove: true
                    }
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
                projectId: null,
                departmentId: null
            }
        };

        const resolution = await WorkflowResolverService.generateSubFlows(policies, context);
        const step = resolution.subFlows[0].stepGroups[0].steps[0];

        expect(step.state).toBe(WorkflowStepRuntimeState.AUTO_APPROVED);
        expect(step.skipped).toBe(false); // It's not skipped due to self-approval, it's auto-approved
    });

    it('results in an APPROVED master state when all steps are AUTO_APPROVED', async () => {
        const resolution: any = {
            resolvers: [],
            watchers: [],
            subFlows: [
                {
                    id: 'sf-1',
                    policyId: 'p1',
                    stepGroups: [
                        {
                            steps: [
                                {
                                    state: WorkflowStepRuntimeState.AUTO_APPROVED,
                                    action: 'APPROVE'
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

    it('respects self-approval skip even if autoApprove is true', async () => {
        const policies: any[] = [
            {
                id: 'policy-auto-self',
                name: 'Auto Approval Self Policy',
                trigger: { requestType: 'LEAVE_REQUEST', role: 'Engineer' },
                steps: [
                    {
                        sequence: 1,
                        resolver: ResolverType.SPECIFIC_USER,
                        resolverId: 'requester-1',
                        scope: ContextScope.GLOBAL,
                        action: 'APPROVE',
                        autoApprove: true
                    }
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

        // Self-approval safety takes precedence over auto-approval
        expect(step.skipped).toBe(true);
        expect(step.state).toBe(WorkflowStepRuntimeState.SKIPPED_SELF_APPROVAL);
        expect(step.resolverIds).toContain('admin-1');
    });
});
