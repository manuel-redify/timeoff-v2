import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';
import { WorkflowMasterRuntimeState, WorkflowSubFlowRuntimeState } from '../lib/types/workflow';
import { LeaveStatus } from '../lib/generated/prisma/enums';

describe('Workflow Aggregation Bug Reproduction', () => {
    it('should NOT approve the master request if only one of multiple sub-flows is approved', () => {
        // SCENARIO: 
        // Policy A (Tech Lead): Nick Fury must approve
        // Policy B (C-Level): Manuel Magnani must approve

        const steps = [
            {
                id: 'step-1',
                approverId: 'nick-fury-id',
                status: 0, // Pending
                sequenceOrder: 1,
                policyId: 'policy-tech-lead'
            },
            {
                id: 'step-2',
                approverId: 'manuel-id',
                status: 1, // Approved
                sequenceOrder: 1,
                policyId: 'policy-c-level'
            }
        ];

        const outcome = WorkflowResolverService.aggregateOutcomeFromApprovalSteps(steps as any);

        // EXPECTATION: PENDING because Nick Fury has not approved yet
        // ACTUAL (BUG): APPROVED because they are currently lumped into one sub-flow
        expect(outcome.masterState).toBe(WorkflowMasterRuntimeState.PENDING);
        expect(outcome.leaveStatus).toBe(LeaveStatus.NEW); // NEW or PENDING, but NOT APPROVED

        const techLeadFlow = outcome.subFlowStates.find(s => s.subFlowId.includes('policy-tech-lead'));
        const cLevelFlow = outcome.subFlowStates.find(s => s.subFlowId.includes('policy-c-level'));

        expect(techLeadFlow?.state).toBe(WorkflowSubFlowRuntimeState.PENDING);
        expect(cLevelFlow?.state).toBe(WorkflowSubFlowRuntimeState.APPROVED);
    });
});
