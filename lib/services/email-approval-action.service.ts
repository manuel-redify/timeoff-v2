import prisma from '@/lib/prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { NotificationService } from '@/lib/services/notification.service';
import { WatcherService } from '@/lib/services/watcher.service';
import { WorkflowAuditService } from '@/lib/services/workflow-audit.service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';
import { WorkflowMasterRuntimeState } from '@/lib/types/workflow';
import { buildScopedLeaveActionUrls } from './email-action-links';

type Actor = {
  id: string;
  isAdmin: boolean;
  name: string;
  lastname: string;
};

type EmailApproveResult = {
  isFinalApproval: boolean;
  decidedAt?: Date;
  leaveRequestId: string;
};

type EmailRejectResult = {
  decidedAt: Date;
  leaveRequestId: string;
};

function getPolicyGroupKey(step: { policyId: string | null; projectId: string | null }): string {
  return step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`;
}

function formatDisplayDuration(durationMinutes: number, minutesPerDay: number): string {
  if (durationMinutes === minutesPerDay) {
    return '1 Day';
  }

  if (durationMinutes > minutesPerDay) {
    const days = Math.ceil(durationMinutes / minutesPerDay);
    return `${days} Days`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

async function notifyNextApprovers(
  leaveRequestId: string,
  nextApproverIds: string[],
  companyId: string,
  baseUrl?: string
) {
  if (nextApproverIds.length === 0) return;

  const requestWithIncludes = await prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      user: { include: { company: true } },
      leaveType: true,
    },
  });

  if (!requestWithIncludes) return;

  const duration = formatDisplayDuration(
    requestWithIncludes.durationMinutes,
    requestWithIncludes.user.company?.minutesPerDay || 480
  );

  await Promise.all(
    nextApproverIds.map(async (approverId) => {
      const actionUrls = await buildScopedLeaveActionUrls(leaveRequestId, approverId, baseUrl);

      await NotificationService.notify(
        approverId,
        'LEAVE_SUBMITTED',
        {
          requesterName: `${requestWithIncludes.user.name} ${requestWithIncludes.user.lastname}`,
          leaveType: requestWithIncludes.leaveType.name,
          startDate: requestWithIncludes.dateStart.toISOString().split('T')[0],
          endDate: requestWithIncludes.dateEnd.toISOString().split('T')[0],
          duration,
          userNotes: requestWithIncludes.employeeComment ?? '',
          approveUrl: actionUrls.approveUrl,
          rejectUrl: actionUrls.rejectUrl,
        },
        companyId
      );
    })
  );
}

export class EmailApprovalActionService {
  static async approveFromEmail(actor: Actor, leaveRequestId: string, baseUrl?: string): Promise<EmailApproveResult> {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          include: { company: true },
        },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if ((leaveRequest.status as string).toUpperCase() !== 'NEW') {
      throw new Error('Request is not in a state that can be approved');
    }

    if (leaveRequest.userId === actor.id && !actor.isAdmin) {
      throw new Error('You cannot approve your own leave request');
    }

    const companyMode = leaveRequest.user.company.mode;
    const hasWorkflowSteps = (await prisma.approvalStep.count({
      where: { leaveId: leaveRequestId },
    })) > 0;

    if (companyMode === 1 && !hasWorkflowSteps) {
      const routing = await ApprovalRoutingService.getApprovers(leaveRequest.userId);
      const isAuthorized = routing.approvers.some((approver) => approver.id === actor.id) || actor.isAdmin;
      if (!isAuthorized) {
        throw new Error('Not authorized to approve this request');
      }

      const decidedAt = new Date();
      await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: 'APPROVED' as any,
          approverId: actor.id,
          decidedAt,
        },
      });

      await NotificationService.notify(
        leaveRequest.userId,
        'LEAVE_APPROVED',
        {
          requesterName: `${leaveRequest.user.name} ${leaveRequest.user.lastname}`,
          approverName: `${actor.name} ${actor.lastname}`,
          leaveType: leaveRequest.leaveType.name,
          startDate: leaveRequest.dateStart.toISOString().split('T')[0],
          endDate: leaveRequest.dateEnd.toISOString().split('T')[0],
          actionUrl: `/requests`,
        },
        leaveRequest.user.companyId
      );

      await WatcherService.notifyWatchers(leaveRequestId, 'LEAVE_APPROVED');

      return { isFinalApproval: true, decidedAt, leaveRequestId };
    }

    const result = await prisma.$transaction(async (tx) => {
      const pendingSteps = await tx.approvalStep.findMany({
        where: {
          leaveId: leaveRequestId,
          status: 0,
        },
        select: {
          id: true,
          approverId: true,
          status: true,
          sequenceOrder: true,
          policyId: true,
          projectId: true,
        },
      });

      if (pendingSteps.length === 0) {
        throw new Error('No pending approval step for this request');
      }

      const policyActionableIds: string[] = [];
      const policyGroups = pendingSteps.reduce((acc, step) => {
        const pid = step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(step);
        return acc;
      }, {} as Record<string, typeof pendingSteps>);

      for (const pid in policyGroups) {
        const steps = policyGroups[pid];
        const minSeq = Math.min(...steps.map((step) => step.sequenceOrder ?? 999));
        const actionable = steps.filter(
          (step) => (step.sequenceOrder ?? 999) === minSeq && step.approverId === actor.id
        );
        policyActionableIds.push(...actionable.map((step) => step.id));
      }

      if (policyActionableIds.length === 0) {
        throw new Error('Earlier approval steps for your specific role/project must be completed first');
      }

      await tx.approvalStep.updateMany({
        where: { id: { in: policyActionableIds } },
        data: { status: 1, updatedAt: new Date() },
      });

      const allSteps = await tx.approvalStep.findMany({
        where: { leaveId: leaveRequestId },
        select: {
          id: true,
          approverId: true,
          status: true,
          sequenceOrder: true,
          policyId: true,
          projectId: true,
        },
      });

      const outcome = WorkflowResolverService.aggregateOutcomeFromApprovalSteps(allSteps);
      const auditBase = {
        leaveId: leaveRequestId,
        companyId: leaveRequest.user.companyId,
        byUserId: actor.id,
      };

      await tx.audit.createMany({
        data: [
          WorkflowAuditService.aggregatorOutcomeEvent(
            auditBase,
            outcome,
            leaveRequest.status as any
          ),
        ],
      });

      if ((outcome.leaveStatus as string).toUpperCase() === 'APPROVED') {
        const decidedAt = new Date();
        await tx.leaveRequest.update({
          where: { id: leaveRequestId },
          data: {
            status: 'APPROVED' as any,
            approverId: actor.id,
            decidedAt,
          },
        });

        return {
          isFinalApproval: true,
          decidedAt,
          nextApproverIds: [] as string[],
        };
      }

      const pendingNext = allSteps.filter((step) => step.status === 0);
      const actedSteps = pendingSteps.filter((step) => policyActionableIds.includes(step.id));
      const affectedPolicyIds = new Set(
        actedSteps.map((step) => step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`)
      );

      const nextApproverIds: string[] = [];
      const nextGroups = pendingNext.reduce((acc, step) => {
        const pid = getPolicyGroupKey(step);
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(step);
        return acc;
      }, {} as Record<string, typeof pendingNext>);

      for (const pid in nextGroups) {
        if (!affectedPolicyIds.has(pid)) continue;

        const steps = nextGroups[pid];
        const minSeq = Math.min(...steps.map((step) => step.sequenceOrder ?? 999));
        const inPolicy = steps
          .filter((step) => (step.sequenceOrder ?? 999) === minSeq)
          .map((step) => step.approverId);
        nextApproverIds.push(...inPolicy);
      }

      return {
        isFinalApproval: false,
        nextApproverIds: Array.from(new Set(nextApproverIds)),
      };
    });

    if (result.isFinalApproval) {
      const requestWithIncludes = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
        include: {
          user: { include: { company: true } },
          leaveType: true,
        },
      });

      if (requestWithIncludes && result.decidedAt) {
        await NotificationService.notify(
          requestWithIncludes.userId,
          'LEAVE_APPROVED',
          {
            requesterName: `${requestWithIncludes.user.name} ${requestWithIncludes.user.lastname}`,
            approverName: `${actor.name} ${actor.lastname}`,
            leaveType: requestWithIncludes.leaveType.name,
            startDate: requestWithIncludes.dateStart.toISOString().split('T')[0],
            endDate: requestWithIncludes.dateEnd.toISOString().split('T')[0],
            actionUrl: `/requests`,
          },
          requestWithIncludes.user.companyId
        );

        await WatcherService.notifyWatchers(leaveRequestId, 'LEAVE_APPROVED');
      }

      return {
        isFinalApproval: true,
        decidedAt: result.decidedAt,
        leaveRequestId,
      };
    }

    await notifyNextApprovers(leaveRequestId, result.nextApproverIds, leaveRequest.user.companyId, baseUrl);

    return {
      isFinalApproval: false,
      leaveRequestId,
    };
  }

  static async rejectFromEmail(
    actor: Actor,
    leaveRequestId: string,
    comment: string
  ): Promise<EmailRejectResult> {
    const trimmedComment = comment.trim();
    if (trimmedComment.length < 10) {
      throw new Error('Please provide a meaningful reason for rejection (minimum 10 characters)');
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          include: { company: true },
        },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if ((leaveRequest.status as string).toUpperCase() !== 'NEW') {
      throw new Error('Request is not in a state that can be rejected');
    }

    const companyMode = leaveRequest.user.company.mode;
    const hasWorkflowSteps = (await prisma.approvalStep.count({
      where: { leaveId: leaveRequestId },
    })) > 0;

    let isAuthorized = actor.isAdmin;

    if (companyMode === 1 && !hasWorkflowSteps) {
      const routing = await ApprovalRoutingService.getApprovers(leaveRequest.userId);
      isAuthorized = isAuthorized || routing.approvers.some((approver) => approver.id === actor.id);
    } else {
      const pendingSteps = await prisma.approvalStep.findMany({
        where: {
          leaveId: leaveRequestId,
          status: 0,
        },
        select: {
          approverId: true,
          sequenceOrder: true,
          policyId: true,
          projectId: true,
        },
      });

      const policyGroups = pendingSteps.reduce((acc, step) => {
        const pid = step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(step);
        return acc;
      }, {} as Record<string, typeof pendingSteps>);

      let actionable = false;
      for (const pid in policyGroups) {
        const steps = policyGroups[pid];
        const minSeq = Math.min(...steps.map((step) => step.sequenceOrder ?? 999));
        if (steps.some((step) => (step.sequenceOrder ?? 999) === minSeq && step.approverId === actor.id)) {
          actionable = true;
          break;
        }
      }

      isAuthorized = isAuthorized || actionable;
    }

    if (!isAuthorized) {
      throw new Error('Not authorized to reject this request');
    }

    const decidedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: 'REJECTED' as any,
          approverId: actor.id,
          approverComment: trimmedComment,
          decidedAt,
        },
      });

      if (companyMode !== 1 || hasWorkflowSteps) {
        await tx.approvalStep.updateMany({
          where: {
            leaveId: leaveRequestId,
            status: 0,
          },
          data: {
            status: 2,
            updatedAt: new Date(),
          },
        });

        const allSteps = await tx.approvalStep.findMany({
          where: { leaveId: leaveRequestId },
          select: {
            id: true,
            approverId: true,
            status: true,
            sequenceOrder: true,
          },
        });
        WorkflowResolverService.aggregateOutcomeFromApprovalSteps(allSteps);
      }

      const auditBase = {
        leaveId: leaveRequestId,
        companyId: leaveRequest.user.companyId,
        byUserId: actor.id,
      };

      const rejectedOutcome = {
        masterState: WorkflowMasterRuntimeState.REJECTED,
        leaveStatus: LeaveStatus.REJECTED,
        subFlowStates: [],
      };

      await tx.audit.createMany({
        data: [
          WorkflowAuditService.aggregatorOutcomeEvent(
            auditBase,
            rejectedOutcome,
            leaveRequest.status as any
          ),
        ],
      });
    });

    await NotificationService.notify(
      leaveRequest.userId,
      'LEAVE_REJECTED',
      {
        approverName: `${actor.name} ${actor.lastname}`,
        leaveType: leaveRequest.leaveType.name,
        startDate: leaveRequest.dateStart.toISOString().split('T')[0],
        endDate: leaveRequest.dateEnd.toISOString().split('T')[0],
        comment: trimmedComment,
        actionUrl: `/requests`,
      },
      leaveRequest.user.companyId
    );

    await WatcherService.notifyWatchers(leaveRequestId, 'LEAVE_REJECTED', {
      approverName: `${actor.name} ${actor.lastname}`,
      comment: trimmedComment,
    });

    return { decidedAt, leaveRequestId };
  }
}
