import prisma from '../prisma';
import { NotificationService, type NotificationType } from './notification.service';
import { WatcherService } from './watcher.service';

type OutboxEventKind = 'DIRECT_NOTIFICATION' | 'WATCHER_NOTIFICATION';

interface BaseOutboxEvent {
  dedupeKey: string;
  companyId: string;
  byUserId: string;
}

export interface DirectNotificationOutboxEvent extends BaseOutboxEvent {
  kind: 'DIRECT_NOTIFICATION';
  payload: {
    userId: string;
    type: NotificationType;
    data: {
      requesterName?: string;
      approverName?: string;
      leaveType?: string;
      startDate?: string;
      endDate?: string;
      actionUrl?: string;
      userName?: string;
      loginUrl?: string;
      comment?: string;
    };
    companyId?: string;
  };
}

export interface WatcherNotificationOutboxEvent extends BaseOutboxEvent {
  kind: 'WATCHER_NOTIFICATION';
  payload: {
    leaveRequestId: string;
    type: 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED';
    metadata?: {
      approverName?: string;
      comment?: string;
      projectId?: string;
    };
  };
}

export type NotificationOutboxEvent =
  | DirectNotificationOutboxEvent
  | WatcherNotificationOutboxEvent;

interface PersistedOutboxPayload {
  kind: OutboxEventKind;
  payload: unknown;
  attempts: number;
  nextAttemptAt: string;
  lastError?: string;
  sentAt?: string;
}

const OUTBOX_ENTITY_TYPE = 'notification_outbox';
const OUTBOX_ATTRIBUTE = 'notification.dispatch';
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 300_000];

export class NotificationOutboxService {
  private static isProcessing = false;
  private static scheduledTimer: ReturnType<typeof setTimeout> | null = null;

  static async enqueueMany(events: NotificationOutboxEvent[]): Promise<void> {
    if (events.length === 0) return;

    const nowIso = new Date().toISOString();

    for (const event of events) {
      const existing = await prisma.audit.findFirst({
        where: {
          entityType: OUTBOX_ENTITY_TYPE,
          entityId: event.dedupeKey,
          attribute: OUTBOX_ATTRIBUTE,
        },
        select: { id: true },
      });

      if (existing) continue;

      const payload: PersistedOutboxPayload = {
        kind: event.kind,
        payload: event.payload,
        attempts: 0,
        nextAttemptAt: nowIso,
      };

      await prisma.audit.create({
        data: {
          entityType: OUTBOX_ENTITY_TYPE,
          entityId: event.dedupeKey,
          attribute: OUTBOX_ATTRIBUTE,
          oldValue: 'PENDING',
          newValue: JSON.stringify(payload),
          companyId: event.companyId,
          byUserId: event.byUserId,
        },
      });
    }
  }

  static kickoffProcessing(delayMs = 0): void {
    if (this.scheduledTimer) return;
    this.scheduledTimer = setTimeout(() => {
      this.scheduledTimer = null;
      void this.processPending();
    }, delayMs);
  }

  static async processPending(limit = 25): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const items = await prisma.audit.findMany({
        where: {
          entityType: OUTBOX_ENTITY_TYPE,
          attribute: OUTBOX_ATTRIBUTE,
          oldValue: { in: ['PENDING', 'RETRY'] },
        },
        orderBy: { at: 'asc' },
        take: limit,
      });

      const now = Date.now();

      for (const item of items) {
        const parsed = this.parsePayload(item.newValue);
        if (!parsed) {
          await this.markDeadLetter(item.id, 1, 'Invalid outbox payload JSON', {
            kind: 'DIRECT_NOTIFICATION',
            payload: {},
            attempts: 0,
            nextAttemptAt: new Date().toISOString(),
          });
          continue;
        }

        if (Date.parse(parsed.nextAttemptAt) > now) continue;

        const attempts = parsed.attempts + 1;

        try {
          await this.dispatch(parsed);
          await prisma.audit.update({
            where: { id: item.id },
            data: {
              oldValue: 'SENT',
              newValue: JSON.stringify({
                ...parsed,
                attempts,
                sentAt: new Date().toISOString(),
                lastError: undefined,
              } satisfies PersistedOutboxPayload),
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown dispatch error';
          if (attempts >= MAX_ATTEMPTS) {
            await this.markDeadLetter(item.id, attempts, message, parsed);
            continue;
          }

          const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
          const nextAttemptAt = new Date(Date.now() + delay).toISOString();

          await prisma.audit.update({
            where: { id: item.id },
            data: {
              oldValue: 'RETRY',
              newValue: JSON.stringify({
                ...parsed,
                attempts,
                nextAttemptAt,
                lastError: message,
              } satisfies PersistedOutboxPayload),
            },
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }

    const remaining = await prisma.audit.findFirst({
      where: {
        entityType: OUTBOX_ENTITY_TYPE,
        attribute: OUTBOX_ATTRIBUTE,
        oldValue: { in: ['PENDING', 'RETRY'] },
      },
      select: { id: true },
    });

    if (remaining) {
      this.kickoffProcessing(5_000);
    }
  }

  private static parsePayload(payload: string | null): PersistedOutboxPayload | null {
    if (!payload) return null;
    try {
      const parsed = JSON.parse(payload) as PersistedOutboxPayload;
      if (!parsed || !parsed.kind || typeof parsed.attempts !== 'number' || !parsed.nextAttemptAt) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private static async dispatch(item: PersistedOutboxPayload): Promise<void> {
    if (item.kind === 'DIRECT_NOTIFICATION') {
      const payload = item.payload as DirectNotificationOutboxEvent['payload'];
      await NotificationService.notify(payload.userId, payload.type, payload.data, payload.companyId);
      return;
    }

    if (item.kind === 'WATCHER_NOTIFICATION') {
      const payload = item.payload as WatcherNotificationOutboxEvent['payload'];
      await WatcherService.notifyWatchers(payload.leaveRequestId, payload.type, payload.metadata);
      return;
    }

    throw new Error(`Unsupported outbox event kind: ${String(item.kind)}`);
  }

  private static async markDeadLetter(
    id: string,
    attempts: number,
    lastError: string,
    previous: PersistedOutboxPayload
  ): Promise<void> {
    await prisma.audit.update({
      where: { id },
      data: {
        oldValue: 'DEAD_LETTER',
        newValue: JSON.stringify({
          ...previous,
          attempts,
          lastError,
        } satisfies PersistedOutboxPayload),
      },
    });
  }
}
