import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { WorkflowAggregateOutcome, WorkflowResolution } from '@/lib/types/workflow';

export const WorkflowAuditAttribute = {
  POLICY_MATCH: 'workflow.policy_match',
  FALLBACK_ACTIVATED: 'workflow.fallback_activated',
  AGGREGATOR_OUTCOME: 'workflow.aggregator_outcome',
  OVERRIDE_APPROVE: 'workflow.override.approve',
  OVERRIDE_REJECT: 'workflow.override.reject',
} as const;

type WorkflowAuditAttributeKey =
  | (typeof WorkflowAuditAttribute)[keyof typeof WorkflowAuditAttribute];

export interface WorkflowAuditEvent {
  entityType: string;
  entityId: string;
  attribute: WorkflowAuditAttributeKey;
  oldValue: string | null;
  newValue: string;
  companyId: string;
  byUserId: string;
}

interface AuditBase {
  leaveId: string;
  companyId: string;
  byUserId: string;
}

export class WorkflowAuditService {
  static policyMatchEvent(
    base: AuditBase,
    payload: {
      requestType: string;
      projectId: string | null;
      matchedPolicyIds: string[];
      matchedPolicyCount: number;
    }
  ): WorkflowAuditEvent {
    return this.build(base, WorkflowAuditAttribute.POLICY_MATCH, payload, null);
  }

  static fallbackEvents(
    base: AuditBase,
    resolution: WorkflowResolution
  ): WorkflowAuditEvent[] {
    const fallbackSteps = resolution.subFlows.flatMap((subFlow) =>
      subFlow.stepGroups.flatMap((group) =>
        group.steps
          .filter((step) => step.fallbackUsed)
          .map((step) => ({
            subFlowId: subFlow.id,
            stepId: step.id,
            sequence: step.sequence,
            resolverIds: step.resolverIds,
          }))
      )
    );

    return fallbackSteps.map((payload) =>
      this.build(base, WorkflowAuditAttribute.FALLBACK_ACTIVATED, payload, null)
    );
  }

  static aggregatorOutcomeEvent(
    base: AuditBase,
    outcome: WorkflowAggregateOutcome,
    previousStatus: LeaveStatus
  ): WorkflowAuditEvent {
    return this.build(
      base,
      WorkflowAuditAttribute.AGGREGATOR_OUTCOME,
      {
        masterState: outcome.masterState,
        leaveStatus: outcome.leaveStatus,
        subFlowStates: outcome.subFlowStates,
      },
      previousStatus
    );
  }

  static overrideApproveEvent(
    base: AuditBase,
    payload: {
      actorId: string;
      reason: string | null;
      previousStatus: LeaveStatus;
    }
  ): WorkflowAuditEvent {
    return this.build(base, WorkflowAuditAttribute.OVERRIDE_APPROVE, payload, payload.previousStatus);
  }

  static overrideRejectEvent(
    base: AuditBase,
    payload: {
      actorId: string;
      reason: string;
      previousStatus: LeaveStatus;
    }
  ): WorkflowAuditEvent {
    return this.build(base, WorkflowAuditAttribute.OVERRIDE_REJECT, payload, payload.previousStatus);
  }

  private static build(
    base: AuditBase,
    attribute: WorkflowAuditAttributeKey,
    payload: unknown,
    oldValue: string | null
  ): WorkflowAuditEvent {
    return {
      entityType: 'leave_request',
      entityId: base.leaveId,
      attribute,
      oldValue,
      newValue: JSON.stringify(payload),
      companyId: base.companyId,
      byUserId: base.byUserId,
    };
  }
}
