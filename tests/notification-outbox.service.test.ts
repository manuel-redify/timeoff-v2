import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationOutboxService } from '../lib/services/notification-outbox.service';
import prisma from '../lib/prisma';
import { NotificationService } from '../lib/services/notification.service';
import { WatcherService } from '../lib/services/watcher.service';

vi.mock('../lib/prisma', () => ({
  default: {
    audit: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../lib/services/notification.service', () => ({
  NotificationService: {
    notify: vi.fn(),
  },
}));

vi.mock('../lib/services/watcher.service', () => ({
  WatcherService: {
    notifyWatchers: vi.fn(),
  },
}));

describe('NotificationOutboxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enqueues only non-duplicate events by dedupe key', async () => {
    (prisma.audit.findFirst as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing' });

    await NotificationOutboxService.enqueueMany([
      {
        dedupeKey: 'k1',
        kind: 'DIRECT_NOTIFICATION',
        companyId: 'c1',
        byUserId: 'u1',
        payload: {
          userId: 'receiver-1',
          type: 'LEAVE_SUBMITTED',
          data: { leaveType: 'Vacation' },
          companyId: 'c1',
        },
      },
      {
        dedupeKey: 'k2',
        kind: 'DIRECT_NOTIFICATION',
        companyId: 'c1',
        byUserId: 'u1',
        payload: {
          userId: 'receiver-2',
          type: 'LEAVE_SUBMITTED',
          data: { leaveType: 'Vacation' },
          companyId: 'c1',
        },
      },
    ]);

    expect(prisma.audit.create).toHaveBeenCalledTimes(1);
    expect(prisma.audit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityType: 'notification_outbox',
          entityId: 'k1',
          oldValue: 'PENDING',
        }),
      })
    );
  });

  it('processes direct notification and marks item as SENT', async () => {
    (prisma.audit.findMany as any).mockResolvedValue([
      {
        id: 'audit-1',
        newValue: JSON.stringify({
          kind: 'DIRECT_NOTIFICATION',
          payload: {
            userId: 'receiver-1',
            type: 'LEAVE_SUBMITTED',
            data: { leaveType: 'Vacation' },
            companyId: 'c1',
          },
          attempts: 0,
          nextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        }),
      },
    ]);
    (NotificationService.notify as any).mockResolvedValue(undefined);

    await NotificationOutboxService.processPending(10);

    expect(NotificationService.notify).toHaveBeenCalledTimes(1);
    expect(prisma.audit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'audit-1' },
        data: expect.objectContaining({
          oldValue: 'SENT',
        }),
      })
    );
  });

  it('retries failed dispatch with RETRY status', async () => {
    (prisma.audit.findMany as any).mockResolvedValue([
      {
        id: 'audit-2',
        newValue: JSON.stringify({
          kind: 'DIRECT_NOTIFICATION',
          payload: {
            userId: 'receiver-1',
            type: 'LEAVE_SUBMITTED',
            data: {},
            companyId: 'c1',
          },
          attempts: 0,
          nextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        }),
      },
    ]);
    (NotificationService.notify as any).mockRejectedValue(new Error('smtp timeout'));

    await NotificationOutboxService.processPending(10);

    expect(prisma.audit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'audit-2' },
        data: expect.objectContaining({
          oldValue: 'RETRY',
        }),
      })
    );
  });

  it('moves item to DEAD_LETTER when max attempts reached', async () => {
    (prisma.audit.findMany as any).mockResolvedValue([
      {
        id: 'audit-3',
        newValue: JSON.stringify({
          kind: 'DIRECT_NOTIFICATION',
          payload: {
            userId: 'receiver-1',
            type: 'LEAVE_SUBMITTED',
            data: {},
            companyId: 'c1',
          },
          attempts: 4,
          nextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        }),
      },
    ]);
    (NotificationService.notify as any).mockRejectedValue(new Error('smtp down'));

    await NotificationOutboxService.processPending(10);

    expect(prisma.audit.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'audit-3' },
        data: expect.objectContaining({
          oldValue: 'DEAD_LETTER',
        }),
      })
    );
  });

  it('dispatches watcher notifications through WatcherService', async () => {
    (prisma.audit.findMany as any).mockResolvedValue([
      {
        id: 'audit-4',
        newValue: JSON.stringify({
          kind: 'WATCHER_NOTIFICATION',
          payload: {
            leaveRequestId: 'leave-1',
            type: 'LEAVE_APPROVED',
            metadata: { approverName: 'System' },
          },
          attempts: 0,
          nextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        }),
      },
    ]);
    (WatcherService.notifyWatchers as any).mockResolvedValue(undefined);

    await NotificationOutboxService.processPending(10);

    expect(WatcherService.notifyWatchers).toHaveBeenCalledWith(
      'leave-1',
      'LEAVE_APPROVED',
      { approverName: 'System' }
    );
  });
});

