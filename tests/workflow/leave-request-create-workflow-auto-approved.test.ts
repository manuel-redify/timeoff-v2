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

jest.mock('@/lib/services/notification-outbox.service', () => ({
    NotificationOutboxService: {
        enqueueMany: jest.fn(),
        kickoffProcessing: jest.fn()
    }
}));

jest.mock('@/lib/leave-calculation-service', () => ({
    LeaveCalculationService: {
        calculateDurationMinutes: jest.fn().mockResolvedValue(480),
    },
    DEFAULT_WORK_START_HOUR: 9,
    DEFAULT_WORK_END_HOUR: 18,
}));

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        leaveType: { findUnique: jest.fn() },
        user: { findUnique: jest.fn(), findMany: jest.fn() },
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
    const buildTx = () => ({
        leaveRequest: { create: jest.fn().mockResolvedValue({ id: 'leave-1' }) },
        approvalStep: { createMany: jest.fn() },
        audit: {
            createMany: jest.fn(),
            create: jest.fn(),
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        prismaMock.user.findMany.mockResolvedValue([]);
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

        const tx = buildTx();
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

        const tx = buildTx();
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

    it('allows admin on-behalf creation with uppercase APPROVED status and bypasses workflow', async () => {
        requireAuthMock.mockResolvedValue({
            id: 'admin-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            name: 'Admin',
            lastname: 'User',
            isAdmin: true,
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

        prismaMock.user.findUnique
            .mockResolvedValueOnce({
                id: 'user-2',
                companyId: 'company-1',
                departmentId: 'dept-2',
                areaId: 'area-2',
                defaultRole: null,
                department: null,
                company: true
            })
            .mockResolvedValueOnce({
                id: 'user-2',
                contractType: { name: 'Employee' },
                company: { id: 'company-1' }
            });

        const tx = buildTx();
        prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

        const request = new Request('http://localhost/api/leave-requests', {
            method: 'POST',
            body: JSON.stringify({
                userId: 'user-2',
                leaveTypeId: 'lt-1',
                dateStart: '2026-03-10',
                dayPartStart: 'ALL',
                dateEnd: '2026-03-10',
                dayPartEnd: 'ALL',
                status: 'APPROVED',
                employeeComment: 'approved by admin'
            })
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(findMatchingPoliciesMock).not.toHaveBeenCalled();
        expect(tx.leaveRequest.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                userId: 'user-2',
                byUserId: 'admin-1',
                status: 'APPROVED',
                approverId: 'admin-1',
                decidedAt: expect.any(Date)
            })
        }));
        expect(tx.approvalStep.createMany).not.toHaveBeenCalled();
    });

    it('allows admin on-behalf creation with uppercase REJECTED status and bypasses workflow', async () => {
        requireAuthMock.mockResolvedValue({
            id: 'admin-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            name: 'Admin',
            lastname: 'User',
            isAdmin: true,
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

        prismaMock.user.findUnique
            .mockResolvedValueOnce({
                id: 'user-2',
                companyId: 'company-1',
                departmentId: 'dept-2',
                areaId: 'area-2',
                defaultRole: null,
                department: null,
                company: true
            })
            .mockResolvedValueOnce({
                id: 'user-2',
                contractType: { name: 'Employee' },
                company: { id: 'company-1' }
            });

        const tx = buildTx();
        prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

        const request = new Request('http://localhost/api/leave-requests', {
            method: 'POST',
            body: JSON.stringify({
                userId: 'user-2',
                leaveTypeId: 'lt-1',
                dateStart: '2026-03-10',
                dayPartStart: 'ALL',
                dateEnd: '2026-03-10',
                dayPartEnd: 'ALL',
                status: 'REJECTED',
                employeeComment: 'rejected by admin'
            })
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(findMatchingPoliciesMock).not.toHaveBeenCalled();
        expect(tx.leaveRequest.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'REJECTED',
                approverId: 'admin-1',
                decidedAt: expect.any(Date)
            })
        }));
        expect(tx.approvalStep.createMany).not.toHaveBeenCalled();
    });

    it('allows admin on-behalf creation with uppercase NEW status and keeps workflow routing active', async () => {
        requireAuthMock.mockResolvedValue({
            id: 'admin-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            name: 'Admin',
            lastname: 'User',
            isAdmin: true,
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

        prismaMock.user.findUnique
            .mockResolvedValueOnce({
                id: 'user-2',
                companyId: 'company-1',
                departmentId: 'dept-2',
                areaId: 'area-2',
                defaultRole: null,
                department: null,
                company: true
            })
            .mockResolvedValueOnce({
                id: 'user-2',
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
            masterState: 'PENDING',
            leaveStatus: LeaveStatus.NEW,
            subFlowStates: []
        });

        const tx = buildTx();
        prismaMock.$transaction.mockImplementation(async (callback: any) => callback(tx));

        const request = new Request('http://localhost/api/leave-requests', {
            method: 'POST',
            body: JSON.stringify({
                userId: 'user-2',
                leaveTypeId: 'lt-1',
                dateStart: '2026-03-10',
                dayPartStart: 'ALL',
                dateEnd: '2026-03-10',
                dayPartEnd: 'ALL',
                status: 'NEW',
                employeeComment: 'pending approval'
            })
        });

        const response = await POST(request);

        expect(response.status).toBe(201);
        expect(findMatchingPoliciesMock).toHaveBeenCalled();
        expect(tx.leaveRequest.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'NEW',
                approverId: null,
                decidedAt: null
            })
        }));
        expect(tx.approvalStep.createMany).toHaveBeenCalled();
    });

    it('rejects non-admin attempts to force APPROVED status', async () => {
        requireAuthMock.mockResolvedValue({
            id: 'user-1',
            companyId: 'company-1',
            departmentId: 'dept-1',
            areaId: 'area-1',
            name: 'Peter',
            lastname: 'Parker',
            isAdmin: false,
            isAutoApprove: false
        });

        const request = new Request('http://localhost/api/leave-requests', {
            method: 'POST',
            body: JSON.stringify({
                leaveTypeId: 'lt-1',
                dateStart: '2026-03-10',
                dayPartStart: 'ALL',
                dateEnd: '2026-03-10',
                dayPartEnd: 'ALL',
                status: 'APPROVED'
            })
        });

        const response = await POST(request);
        const payload = await response.json();

        expect(response.status).toBe(403);
        expect(payload.error).toBe('Only admins can set terminal leave request statuses.');
        expect(validateRequestMock).not.toHaveBeenCalled();
        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
});
