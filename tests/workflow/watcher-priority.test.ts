jest.mock('../../lib/prisma', () => ({
    __esModule: true,
    default: {
        leaveRequest: { findUnique: jest.fn() },
    }
}));

jest.mock('../../lib/services/notification.service', () => ({
    NotificationService: {
        notify: jest.fn()
    }
}));

import prisma from '../../lib/prisma';
import { WatcherService } from '../../lib/services/watcher.service';
import { NotificationService } from '../../lib/services/notification.service';

const prismaMock = prisma as any;
const notifyMock = NotificationService.notify as jest.Mock;

describe('Watcher priority handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('excludes pending approvers from watcher notifications', async () => {
        jest.spyOn(WatcherService, 'getWatchersForRequest').mockResolvedValue([
            'watcher-1',
            'approver-1',
        ]);

        prismaMock.leaveRequest.findUnique.mockResolvedValue({
            id: 'leave-1',
            approvalSteps: [{ approverId: 'approver-1' }],
            user: { companyId: 'company-1', name: 'Peter', lastname: 'Parker' },
            leaveType: { name: 'Vacation' },
            dateStart: new Date('2026-03-15'),
            dateEnd: new Date('2026-03-16'),
        });

        await WatcherService.notifyWatchers('leave-1', 'LEAVE_SUBMITTED');

        expect(notifyMock).toHaveBeenCalledTimes(1);
        expect(notifyMock).toHaveBeenCalledWith(
            'watcher-1',
            'LEAVE_SUBMITTED',
            expect.any(Object),
            'company-1'
        );
    });
});
