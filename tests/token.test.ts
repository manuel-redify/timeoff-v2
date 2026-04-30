jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    leaveRequest: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/approval-routing-service', () => ({
  ApprovalRoutingService: {
    getApprovers: jest.fn(),
  },
}));

import { ApprovalRoutingService } from '@/lib/approval-routing-service';
import { generateActionToken, getActionTokenState, validateActionToken } from '@/lib/token';

const prisma = jest.requireMock('@/lib/prisma').default as {
  leaveRequest: {
    findUnique: jest.Mock;
  };
};

const approvalRoutingServiceMock = ApprovalRoutingService as unknown as {
  getApprovers: jest.Mock;
};

describe('action token workflow handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_ACTION_TOKEN_SECRET = 'test-secret';
  });

  it('treats an actionable workflow step as valid', async () => {
    const token = await generateActionToken('leave-1', 'approver-1');
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'leave-1',
      userId: 'requester-1',
      status: 'NEW',
      user: { company: { mode: 2 } },
      approver: {},
      leaveType: {},
      approvalSteps: [
        {
          approverId: 'approver-1',
          status: 0,
          sequenceOrder: 1,
          policyId: 'policy-1',
          projectId: null,
        },
      ],
    });

    await expect(getActionTokenState(token)).resolves.toMatchObject({
      kind: 'valid',
      approverId: 'approver-1',
    });

    await expect(validateActionToken(token)).resolves.toMatchObject({
      approverId: 'approver-1',
      leaveRequest: expect.objectContaining({ id: 'leave-1' }),
    });
  });

  it('marks already approved approver step as processed while request can still be NEW', async () => {
    const token = await generateActionToken('leave-1', 'approver-1');
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'leave-1',
      userId: 'requester-1',
      status: 'NEW',
      user: { company: { mode: 2 } },
      approver: {},
      leaveType: {},
      approvalSteps: [
        {
          approverId: 'approver-1',
          status: 1,
          sequenceOrder: 1,
          policyId: 'policy-1',
          projectId: null,
        },
        {
          approverId: 'approver-2',
          status: 0,
          sequenceOrder: 1,
          policyId: 'policy-2',
          projectId: null,
        },
      ],
    });

    await expect(getActionTokenState(token)).resolves.toMatchObject({
      kind: 'processed',
      usageReason: 'step-already-processed',
    });
  });

  it('validates basic-mode tokens against current routing approvers', async () => {
    const token = await generateActionToken('leave-1', 'approver-1');
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'leave-1',
      userId: 'requester-1',
      status: 'NEW',
      user: { company: { mode: 1 } },
      approver: {},
      leaveType: {},
      approvalSteps: [],
    });
    approvalRoutingServiceMock.getApprovers.mockResolvedValue({
      approvers: [{ id: 'approver-1' }],
    });

    await expect(validateActionToken(token)).resolves.toMatchObject({
      approverId: 'approver-1',
    });
  });
});
