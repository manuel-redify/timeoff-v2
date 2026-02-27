import { LeaveStatus } from '@/lib/generated/prisma/enums';

jest.mock('@/lib/rbac', () => ({
    getCurrentUser: jest.fn()
}));

jest.mock('@/lib/services/workflow-resolver-service', () => ({
    WorkflowResolverService: {
        aggregateOutcomeFromApprovalSteps: jest.fn()
    }
}));

jest.mock('@/lib/services/notification.service', () => ({
    NotificationService: { notify: jest.fn() }
}));

jest.mock('@/lib/services/watcher.service', () => ({
    WatcherService: { notifyWatchers: jest.fn() }
}));

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        leaveRequest: { findUnique: jest.fn() },
        $transaction: jest.fn()
    }
}));

import { POST } from '@/app/api/leave-requests/[id]/approve/route';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';

const prismaMock = prisma as any;
const getCurrentUserMock = getCurrentUser as jest.Mock;
const aggregateOutcomeFromApprovalStepsMock = WorkflowResolverService.aggregateOutcomeFromApprovalSteps as jest.Mock;

describe('Leave approve API - audit on final approval', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('writes audit events when advanced-mode approval finalizes the request', async () => {
        getCurrentUserMock.mockResolvedValue({
            id: 'approver-1',
            isAdmin: false,
            name: 'Tony',
            lastname: 'Stark'
        });

        prismaMock.leaveRequest.findUnique.mockResolvedValue({
            id: 'leave-1',
            status: 'NEW',
            userId: 'requester-1',
            dateStart: new Date('2026-03-11'),
            dateEnd: new Date('2026-03-11'),
            leaveType: { name: 'Vacation' },
            user: {
                id: 'requester-1',
                companyId: 'company-1',
                name: 'Peter',
                lastname: 'Parker',
                company: { mode: 2 }
            }
        });

        aggregateOutcomeFromApprovalStepsMock.mockReturnValue({
            masterState: 'APPROVED',
            leaveStatus: LeaveStatus.APPROVED,
            subFlowStates: []
        });

        const tx = {
            approvalStep: {
                findMany: jest
                    .fn()
                    .mockResolvedValueOnce([
                        {
                            id: 'step-1',
                            approverId: 'approver-1',
                            status: 0,
                            sequenceOrder: 1,
                            policyId: 'policy-1',
                            projectId: null
                        }
                    ])
                    .mockResolvedValueOnce([
                        {
                            id: 'step-1',
                            approverId: 'approver-1',
                            status: 1,
                            sequenceOrder: 1,
                            policyId: 'policy-1',
                            projectId: null
                        }
                    ]),
                updateMany: jest.fn()
            },
            leaveRequest: {
                update: jest.fn()
            },
            audit: {
                createMany: jest.fn()
            }
        };

        prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

        const request = new Request('http://localhost/api/leave-requests/leave-1/approve', {
            method: 'POST',
            body: JSON.stringify({ comment: 'approved' })
        });

        const response = await POST(request, { params: Promise.resolve({ id: 'leave-1' }) });

        expect(response.status).toBe(200);
        expect(tx.audit.createMany).toHaveBeenCalledTimes(1);
    });
});
