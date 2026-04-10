jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        leaveRequest: { findMany: jest.fn() },
    }
}));

import prisma from '@/lib/prisma';
import { LeaveValidationService } from '@/lib/leave-validation-service';
import { DayPart } from '@/lib/generated/prisma/enums';

const prismaMock = prisma as any;

describe('LeaveValidationService overlap detection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('allows non-overlapping custom ranges on the same day', async () => {
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: 'leave-1',
                dateStart: new Date(2026, 3, 9, 9, 0),
                dateEnd: new Date(2026, 3, 9, 11, 0),
                dayPartStart: 'ALL',
                dayPartEnd: 'ALL',
                status: 'approved',
            }
        ]);

        const overlaps = await (LeaveValidationService as any).detectOverlaps(
            'user-1',
            new Date(2026, 3, 9),
            DayPart.ALL,
            new Date(2026, 3, 9),
            DayPart.ALL,
            480,
            { hours: 17, minutes: 0 },
            { hours: 18, minutes: 0 }
        );

        expect(overlaps).toHaveLength(0);
    });

    it('detects partial overlap for custom ranges on the same day', async () => {
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: 'leave-1',
                dateStart: new Date(2026, 3, 9, 9, 0),
                dateEnd: new Date(2026, 3, 9, 11, 0),
                dayPartStart: 'ALL',
                dayPartEnd: 'ALL',
                status: 'approved',
            }
        ]);

        const overlaps = await (LeaveValidationService as any).detectOverlaps(
            'user-1',
            new Date(2026, 3, 9),
            DayPart.ALL,
            new Date(2026, 3, 9),
            DayPart.ALL,
            480,
            { hours: 10, minutes: 30 },
            { hours: 12, minutes: 0 }
        );

        expect(overlaps).toHaveLength(1);
        expect(overlaps[0].id).toBe('leave-1');
    });

    it('allows adjacent custom ranges without overlap', async () => {
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: 'leave-1',
                dateStart: new Date(2026, 3, 9, 9, 0),
                dateEnd: new Date(2026, 3, 9, 11, 0),
                dayPartStart: 'ALL',
                dayPartEnd: 'ALL',
                status: 'approved',
            }
        ]);

        const overlaps = await (LeaveValidationService as any).detectOverlaps(
            'user-1',
            new Date(2026, 3, 9),
            DayPart.ALL,
            new Date(2026, 3, 9),
            DayPart.ALL,
            480,
            { hours: 11, minutes: 0 },
            { hours: 12, minutes: 0 }
        );

        expect(overlaps).toHaveLength(0);
    });

    it('detects overlap between preset all-day and custom range', async () => {
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: 'leave-1',
                dateStart: new Date(2026, 3, 9, 9, 0),
                dateEnd: new Date(2026, 3, 9, 17, 0),
                dayPartStart: 'ALL',
                dayPartEnd: 'ALL',
                status: 'approved',
            }
        ]);

        const overlaps = await (LeaveValidationService as any).detectOverlaps(
            'user-1',
            new Date(2026, 3, 9),
            DayPart.ALL,
            new Date(2026, 3, 9),
            DayPart.ALL,
            480,
            { hours: 16, minutes: 0 },
            { hours: 17, minutes: 30 }
        );

        expect(overlaps).toHaveLength(1);
    });

    it('detects overlap between multi-day request and single-day custom range', async () => {
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: 'leave-1',
                dateStart: new Date(2026, 3, 9, 9, 0),
                dateEnd: new Date(2026, 3, 11, 17, 0),
                dayPartStart: 'ALL',
                dayPartEnd: 'ALL',
                status: 'approved',
            }
        ]);

        const overlaps = await (LeaveValidationService as any).detectOverlaps(
            'user-1',
            new Date(2026, 3, 10),
            DayPart.ALL,
            new Date(2026, 3, 10),
            DayPart.ALL,
            480,
            { hours: 17, minutes: 0 },
            { hours: 18, minutes: 0 }
        );

        expect(overlaps).toHaveLength(1);
    });

    it('preserves legacy preset behavior for morning and afternoon as adjacent non-overlapping ranges', async () => {
        prismaMock.leaveRequest.findMany.mockResolvedValue([
            {
                id: 'leave-1',
                dateStart: new Date(2026, 3, 9, 9, 0),
                dateEnd: new Date(2026, 3, 9, 13, 0),
                dayPartStart: 'MORNING',
                dayPartEnd: 'MORNING',
                status: 'approved',
            }
        ]);

        const overlaps = await (LeaveValidationService as any).detectOverlaps(
            'user-1',
            new Date(2026, 3, 9),
            DayPart.AFTERNOON,
            new Date(2026, 3, 9),
            DayPart.AFTERNOON,
            480
        );

        expect(overlaps).toHaveLength(0);
    });
});
