import crypto from 'crypto';
import prisma from './prisma';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import type { Prisma } from '@/lib/generated/prisma/client';
import { ApprovalRoutingService } from '@/lib/approval-routing-service';

type ActionTokenLeaveRequest = Prisma.LeaveRequestGetPayload<{
  include: {
    user: {
      include: {
        company: true;
      };
    };
    approver: true;
    leaveType: true;
    approvalSteps: true;
  };
}>;

type TokenUsageReason = 'request-finalized' | 'step-already-processed' | 'step-no-longer-actionable';

export type ActionTokenState =
  | {
      kind: 'valid';
      leaveRequest: ActionTokenLeaveRequest;
      approverId: string;
    }
  | {
      kind: 'expired' | 'invalid';
      leaveRequest: null;
      approverId?: undefined;
      usageReason?: undefined;
    }
  | {
      kind: 'processed';
      leaveRequest: ActionTokenLeaveRequest;
      approverId: string;
      usageReason: TokenUsageReason;
    };

type ActionTokenPayload = {
  v: 1;
  leaveRequestId: string;
  approverId: string;
  exp: number;
};

function getActionTokenSecret(): string {
  const secret =
    process.env.EMAIL_ACTION_TOKEN_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('Missing EMAIL_ACTION_TOKEN_SECRET or AUTH/NEXTAUTH secret for email action tokens');
  }

  return secret;
}

function encodeToken(payload: ActionTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getActionTokenSecret())
    .update(body)
    .digest('base64url');

  return `${body}.${signature}`;
}

function decodeToken(token: string): ActionTokenPayload | null {
  if (!token || !token.includes('.')) return null;

  const [body, providedSignature] = token.split('.', 2);
  if (!body || !providedSignature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', getActionTokenSecret())
    .update(body)
    .digest('base64url');

  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as ActionTokenPayload;
    if (
      parsed?.v !== 1 ||
      typeof parsed.leaveRequestId !== 'string' ||
      typeof parsed.approverId !== 'string' ||
      typeof parsed.exp !== 'number'
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isPendingLeaveStatus(status: string | null | undefined): boolean {
  return typeof status === 'string' && status.toLowerCase() === LeaveStatus.NEW;
}

function getPolicyGroupKey(step: { policyId: string | null; projectId: string | null }): string {
  return step.policyId || `PROJECT_${step.projectId || 'UNKNOWN'}`;
}

function getActionablePendingSteps<T extends {
  approverId: string;
  sequenceOrder: number | null;
  policyId: string | null;
  projectId: string | null;
  status?: number;
}>(steps: T[], approverId: string): T[] {
  const grouped = steps.reduce((acc, step) => {
    const key = getPolicyGroupKey(step);
    if (!acc[key]) acc[key] = [];
    acc[key].push(step);
    return acc;
  }, {} as Record<string, T[]>);

  const actionable: T[] = [];
  for (const key in grouped) {
    const groupSteps = grouped[key];
    const minSeq = Math.min(...groupSteps.map((step) => step.sequenceOrder ?? 999));
    const current = groupSteps.filter(
      (step) => (step.sequenceOrder ?? 999) === minSeq && step.approverId === approverId
    );
    actionable.push(...current);
  }

  return actionable;
}

async function getLeaveRequestForToken(leaveRequestId: string) {
  return prisma.leaveRequest.findUnique({
    where: { id: leaveRequestId },
    include: {
      user: {
        include: {
          company: true,
        },
      },
      approver: true,
      leaveType: true,
      approvalSteps: true,
    },
  });
}

async function evaluateTokenState(
  leaveRequest: ActionTokenLeaveRequest,
  approverId: string
): Promise<'valid' | { kind: 'processed'; reason: TokenUsageReason }> {
  if (!isPendingLeaveStatus(leaveRequest.status)) {
    return { kind: 'processed', reason: 'request-finalized' };
  }

  const hasWorkflowSteps = leaveRequest.approvalSteps.length > 0;
  if (!hasWorkflowSteps) {
    const routing = await ApprovalRoutingService.getApprovers(leaveRequest.userId);
    const isAuthorized = routing.approvers.some((approver) => approver.id === approverId);
    return isAuthorized
      ? 'valid'
      : { kind: 'processed', reason: 'step-no-longer-actionable' };
  }

  const pendingSteps = leaveRequest.approvalSteps.filter((step) => step.status === 0);
  const actionableSteps = getActionablePendingSteps(pendingSteps, approverId);
  if (actionableSteps.length > 0) {
    return 'valid';
  }

  const approverSteps = leaveRequest.approvalSteps.filter((step) => step.approverId === approverId);
  if (approverSteps.some((step) => step.status !== 0)) {
    return { kind: 'processed', reason: 'step-already-processed' };
  }

  return { kind: 'processed', reason: 'step-no-longer-actionable' };
}

/**
 * Generate a secure action token for email approval/rejection links.
 * The token is approver-scoped and stateless so it can mirror workflow-step authorization.
 */
export async function generateActionToken(
  leaveRequestId: string,
  approverId: string,
  expiresInDays: number = 7,
  _client?: unknown
): Promise<string> {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiresInDays);

  return encodeToken({
    v: 1,
    leaveRequestId,
    approverId,
    exp: expiryDate.getTime(),
  });
}

/**
 * Validate an action token and return associated data if currently actionable.
 */
export async function validateActionToken(token: string) {
  const payload = decodeToken(token);
  if (!payload) return null;
  if (payload.exp <= Date.now()) return null;

  const leaveRequest = await getLeaveRequestForToken(payload.leaveRequestId);
  if (!leaveRequest) return null;

  const state = await evaluateTokenState(leaveRequest, payload.approverId);
  if (state !== 'valid') return null;

  return {
    leaveRequest,
    approverId: payload.approverId,
  };
}

export async function getActionTokenState(token: string): Promise<ActionTokenState> {
  const payload = decodeToken(token);
  if (!payload) {
    return { kind: 'invalid', leaveRequest: null };
  }

  if (payload.exp <= Date.now()) {
    return { kind: 'expired', leaveRequest: null };
  }

  const leaveRequest = await getLeaveRequestForToken(payload.leaveRequestId);
  if (!leaveRequest) {
    return { kind: 'invalid', leaveRequest: null };
  }

  const state = await evaluateTokenState(leaveRequest, payload.approverId);
  if (state === 'valid') {
    return { kind: 'valid', leaveRequest, approverId: payload.approverId };
  }

  return {
    kind: 'processed',
    leaveRequest,
    approverId: payload.approverId,
    usageReason: state.reason,
  };
}

/**
 * Stateless tokens do not need explicit invalidation. They become unusable once the workflow state changes.
 */
export async function invalidateActionToken(_token: string) {
  return;
}
