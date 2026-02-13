import { LeaveStatus } from '../../lib/generated/prisma/enums';
import { WorkflowAuditAttribute, WorkflowAuditService } from '../../lib/services/workflow-audit.service';
import { WorkflowMasterRuntimeState, WorkflowSubFlowRuntimeState } from '../../lib/types/workflow';

describe('WorkflowAuditService', () => {
    const base = {
        leaveId: 'leave-1',
        companyId: 'company-1',
        byUserId: 'actor-1'
    };

    it('emits canonical aggregator event with traceability fields', () => {
        const event = WorkflowAuditService.aggregatorOutcomeEvent(
            base,
            {
                masterState: WorkflowMasterRuntimeState.APPROVED,
                leaveStatus: LeaveStatus.APPROVED,
                subFlowStates: [{ subFlowId: 'sf-1', state: WorkflowSubFlowRuntimeState.APPROVED }]
            },
            LeaveStatus.NEW
        );

        expect(event.attribute).toBe(WorkflowAuditAttribute.AGGREGATOR_OUTCOME);
        expect(event.entityType).toBe('leave_request');
        expect(event.entityId).toBe(base.leaveId);
        expect(event.companyId).toBe(base.companyId);
        expect(event.byUserId).toBe(base.byUserId);
        expect(event.oldValue).toBe(LeaveStatus.NEW);
    });

    it('emits explicit admin override events for approve and reject', () => {
        const approveOverride = WorkflowAuditService.overrideApproveEvent(base, {
            actorId: 'admin-1',
            reason: 'force approve',
            previousStatus: LeaveStatus.NEW
        });
        const rejectOverride = WorkflowAuditService.overrideRejectEvent(base, {
            actorId: 'admin-1',
            reason: 'policy violation',
            previousStatus: LeaveStatus.NEW
        });

        expect(approveOverride.attribute).toBe(WorkflowAuditAttribute.OVERRIDE_APPROVE);
        expect(rejectOverride.attribute).toBe(WorkflowAuditAttribute.OVERRIDE_REJECT);
        expect(approveOverride.newValue).toContain('force approve');
        expect(rejectOverride.newValue).toContain('policy violation');
    });
});
