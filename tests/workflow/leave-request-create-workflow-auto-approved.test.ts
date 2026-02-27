import { LeaveStatus } from '@/lib/generated/prisma/enums';

jest.mock('@/lib/api-auth', () => ({
    requireAuth: jest.fn(),
    handleAuthError: jest.fn((error: unknown) => {
        throw error;
    })
}));

jest.mock('@/lib/leave-validation-service', () => ({
    LeaveValidationService: {
        validateRequest: jest.fn()
    }
}));

jest.mock('@/lib/services/workflow-resolver-service', () => ({
    WorkflowResolverService: {
        findMatchingPolicies: jest.fn(),
        generateSubFlows: jest.fn(),
        aggregateOutcome: jest.fn()
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
        leaveType: { findUnique: jest.fn() },
        user: { findUnique: jest.fn() },
        userProject: { findMany: jest.fn() },
        $transaction: jest.fn()
    }
}));

import { POST } from '@/app/api/leave-requests/route';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import { LeaveValidationService } from '@/lib/leave-validation-service';
import { WorkflowResolverService } from '@/lib/services/workflow-resolver-service';

const prismaMock = prisma as any;
const requireAuthMock = requireAuth as jest.Mock;
const validateRequestMock = LeaveValidationService.validateRequest as jest.Mock;
const findMatchingPoliciesMock = WorkflowResolverService.findMatchingPolicies as jest.Mock;
const generateSubFlowsMock = WorkflowResolverService.generateSubFlows as jest.Mock;
const aggregateOutcomeMock = WorkflowResolverService.aggregateOutcome as jest.Mock;

describe('Leave Request API - workflow immediate approval', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not create pending approval steps when workflow outcome is APPROVED', async () => {
        requireAuthMock.mockResolvedValue({
            id: 'user-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            name: 'Peter',
            lastname: 'Parker',
            isAutoApprove: false
        });

        validateRequestMock.mockResolvedValue({
            isValid: true,
            errors: [],
            daysRequested: 1
        });

        prismaMock.leaveType.findUnique.mockResolvedValue({
            id: 'lt-1',
            name: 'Vacation',
            autoApprove: false
        });

        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            contractType: { name: 'Employee' },
            company: { id: 'company-1' }
        });

        findMatchingPoliciesMock.mockResolvedValue([{ id: 'policy-1', steps: [], watchers: [] }]);
        generateSubFlowsMock.mockResolvedValue({
            resolvers: [{ userId: 'approver-1', step: 1, policyId: 'policy-1', type: 'ROLE' }],
            watchers: [],
            subFlows: []
        });
        aggregateOutcomeMock.mockReturnValue({
            masterState: 'APPROVED',
            leaveStatus: LeaveStatus.APPROVED,
            subFlowStates: []
        });

        const tx = {
            leaveRequest: { create: jest.fn().mockResolvedValue({ id: 'leave-1' }) },
            approvalStep: { createMany: jest.fn() },
            audit: { createMany: jest.fn() }
        };
        prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

        const request = new Request('http://localhost/api/leave-requests', {
            method: 'POST',
            body: JSON.stringify({
                leaveTypeId: 'lt-1',
                dateStart: '2026-03-10',
                dayPartStart: 'ALL',
                dateEnd: '2026-03-10',
                dayPartEnd: 'ALL',
                employeeComment: 'test'
            })
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(tx.approvalStep.createMany).not.toHaveBeenCalled();
    });

    it('persists policy project context for each generated approval step when projectId is omitted', async () => {
        requireAuthMock.mockResolvedValue({
            id: 'user-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            name: 'Peter',
            lastname: 'Parker',
            isAutoApprove: false
        });

        validateRequestMock.mockResolvedValue({
            isValid: true,
            errors: [],
            daysRequested: 1
        });

        prismaMock.leaveType.findUnique.mockResolvedValue({
            id: 'lt-1',
            name: 'Vacation',
            autoApprove: false
        });

        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-1',
            contractType: { name: 'Employee' },
            company: { id: 'company-1' }
        });

        findMatchingPoliciesMock.mockResolvedValue([
            { id: 'policy-project-1', steps: [], watchers: [] },
            { id: 'policy-project-2', steps: [], watchers: [] }
        ]);
        generateSubFlowsMock.mockResolvedValue({
            resolvers: [
                { userId: 'approver-1', step: 1, policyId: 'policy-project-1', type: 'ROLE' },
                { userId: 'approver-2', step: 1, policyId: 'policy-project-2', type: 'ROLE' }
            ],
            watchers: [],
            subFlows: [
                { policyId: 'policy-project-1', origin: { projectId: 'project-1' }, stepGroups: [] },
                { policyId: 'policy-project-2', origin: { projectId: 'project-2' }, stepGroups: [] }
            ]
        });
        aggregateOutcomeMock.mockReturnValue({
            masterState: 'PENDING',
            leaveStatus: LeaveStatus.NEW,
            subFlowStates: []
        });

        const tx = {
            leaveRequest: { create: jest.fn().mockResolvedValue({ id: 'leave-1' }) },
            approvalStep: { createMany: jest.fn() },
            audit: { createMany: jest.fn() }
        };
        prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

        const request = new Request('http://localhost/api/leave-requests', {
            method: 'POST',
            body: JSON.stringify({
                leaveTypeId: 'lt-1',
                dateStart: '2026-03-10',
                dayPartStart: 'ALL',
                dateEnd: '2026-03-10',
                dayPartEnd: 'ALL',
                employeeComment: 'test'
            })
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(tx.approvalStep.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ approverId: 'approver-1', policyId: 'policy-project-1', projectId: 'project-1' }),
                expect.objectContaining({ approverId: 'approver-2', policyId: 'policy-project-2', projectId: 'project-2' })
            ])
        });
    });
});
