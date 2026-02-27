jest.mock('@/auth', () => ({
    auth: jest.fn()
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
        user: { findUnique: jest.fn() },
        approvalDelegation: { findMany: jest.fn() },
        leaveRequest: { findMany: jest.fn() },
        $transaction: jest.fn(),
    }
}));

import { POST } from '@/app/api/approvals/bulk-action/route';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

const prismaMock = prisma as any;
const authMock = auth as jest.Mock;

describe('Bulk action route audit coverage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('writes override approve audit event when admin force-approves without actionable steps', async () => {
        authMock.mockResolvedValue({ user: { id: 'admin-1' } });
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'admin-1',
            companyId: 'company-1',
            name: 'Admin',
            lastname: 'User',
            isAdmin: true
        });
        prismaMock.approvalDelegation.findMany.mockResolvedValue([]);
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: '11111111-1111-1111-8111-111111111111',
                status: 'NEW',
                dateStart: new Date('2026-03-10'),
                dateEnd: new Date('2026-03-10'),
                user: { id: 'req-1', name: 'Peter', lastname: 'Parker', email: 'peter@example.com' },
                leaveType: { id: 'lt-1', name: 'Vacation' }
            }
        ]);

        const tx = {
            approvalStep: {
                findMany: jest
                    .fn()
                    .mockResolvedValueOnce([
                        {
                            id: 's-1',
                            approverId: 'approver-1',
                            status: 0,
                            sequenceOrder: 1,
                            policyId: 'policy-1',
                            projectId: null
                        }
                    ])
                    .mockResolvedValueOnce([
                        {
                            id: 's-1',
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

        const request = new Request('http://localhost/api/approvals/bulk-action', {
            method: 'POST',
            body: JSON.stringify({
                requestIds: ['11111111-1111-1111-8111-111111111111'],
                action: 'approve',
                comment: 'force approve'
            })
        });

        const response = await POST(request as any);
        expect(response.status).toBe(200);
        expect(tx.audit.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ attribute: 'workflow.aggregator_outcome' }),
                expect.objectContaining({ attribute: 'workflow.override.approve' })
            ])
        });
    });

    it('writes override reject audit event when admin force-rejects without actionable steps', async () => {
        authMock.mockResolvedValue({ user: { id: 'admin-1' } });
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'admin-1',
            companyId: 'company-1',
            name: 'Admin',
            lastname: 'User',
            isAdmin: true
        });
        prismaMock.approvalDelegation.findMany.mockResolvedValue([]);
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: '22222222-2222-2222-8222-222222222222',
                status: 'NEW',
                dateStart: new Date('2026-03-11'),
                dateEnd: new Date('2026-03-11'),
                user: { id: 'req-2', name: 'Bruce', lastname: 'Banner', email: 'bruce@example.com' },
                leaveType: { id: 'lt-1', name: 'Vacation' }
            }
        ]);

        const tx = {
            approvalStep: {
                findMany: jest
                    .fn()
                    .mockResolvedValueOnce([
                        {
                            id: 's-2',
                            approverId: 'approver-2',
                            status: 0,
                            sequenceOrder: 1,
                            policyId: 'policy-2',
                            projectId: null
                        }
                    ])
                    .mockResolvedValueOnce([
                        {
                            id: 's-2',
                            approverId: 'approver-2',
                            status: 2,
                            sequenceOrder: 1,
                            policyId: 'policy-2',
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

        const request = new Request('http://localhost/api/approvals/bulk-action', {
            method: 'POST',
            body: JSON.stringify({
                requestIds: ['22222222-2222-2222-8222-222222222222'],
                action: 'reject',
                comment: 'force reject'
            })
        });

        const response = await POST(request as any);
        expect(response.status).toBe(200);
        expect(tx.audit.createMany).toHaveBeenCalledWith({
            data: expect.arrayContaining([
                expect.objectContaining({ attribute: 'workflow.aggregator_outcome' }),
                expect.objectContaining({ attribute: 'workflow.override.reject' })
            ])
        });
    });
});
