import { LeaveCalculationService, DEFAULT_WORK_START_HOUR, DEFAULT_WORK_END_HOUR } from '../lib/leave-calculation-service';
import { DayPart } from '../lib/generated/prisma/enums';

describe('LeaveCalculationService', () => {
  const mockContext = {
    userId: 'user-1',
    companyId: 'company-1',
    includePublicHolidays: true,
    minutesPerDay: 480,
    schedule: {
      monday: 1,
      tuesday: 1,
      wednesday: 1,
      thursday: 1,
      friday: 1,
      saturday: 2,
      sunday: 2,
    },
    holidayDates: new Set<string>(),
  };

  describe('calculateDurationMinutesWithContext', () => {
    describe('single-day requests', () => {
      it('should calculate full day as 480 minutes (8h)', () => {
        const startDate = new Date('2026-03-02');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          startDate,
          DayPart.ALL,
          startDate,
          DayPart.ALL
        );
        expect(result).toBe(480);
      });

      it('should calculate morning as 240 minutes (4h)', () => {
        const startDate = new Date('2026-03-02');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          startDate,
          DayPart.MORNING,
          startDate,
          DayPart.MORNING
        );
        expect(result).toBe(240);
      });

      it('should calculate afternoon as 240 minutes (4h)', () => {
        const startDate = new Date('2026-03-02');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          startDate,
          DayPart.AFTERNOON,
          startDate,
          DayPart.AFTERNOON
        );
        expect(result).toBe(240);
      });

      it('should calculate custom time range correctly', () => {
        const startDate = new Date('2026-03-02');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          startDate,
          DayPart.ALL,
          startDate,
          DayPart.ALL,
          { hours: 9, minutes: 30 },
          { hours: 13, minutes: 45 }
        );
        expect(result).toBe(255); // 4h 15m = 255 minutes
      });

      it('should return 0 for invalid time range (end before start)', () => {
        const startDate = new Date('2026-03-02');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          startDate,
          DayPart.ALL,
          startDate,
          DayPart.ALL,
          { hours: 17, minutes: 0 },
          { hours: 9, minutes: 0 }
        );
        expect(result).toBe(0);
      });
    });

    describe('multi-day requests', () => {
      it('should calculate full week (Mon-Fri) as 2400 minutes', () => {
        const monday = new Date('2026-03-02'); // Monday
        const friday = new Date('2026-03-06'); // Friday
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          monday,
          DayPart.ALL,
          friday,
          DayPart.ALL
        );
        expect(result).toBe(2400); // 5 days * 480 minutes
      });

      it('should exclude weekends from calculation', () => {
        const friday = new Date('2026-03-06'); // Friday
        const monday = new Date('2026-03-09'); // Monday
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          friday,
          DayPart.ALL,
          monday,
          DayPart.ALL
        );
        expect(result).toBe(960); // Fri + Mon = 2 days * 480
      });

      it('should calculate mixed day parts correctly', () => {
        const monday = new Date('2026-03-02');
        const tuesday = new Date('2026-03-03');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          monday,
          DayPart.MORNING,
          tuesday,
          DayPart.AFTERNOON
        );
        expect(result).toBe(480); // 240 (Mon morning) + 240 (Tue afternoon)
      });

      it('should skip holidays in calculation', () => {
        const contextWithHoliday = {
          ...mockContext,
          holidayDates: new Set(['2026-03-04']), // Wednesday
        };
        const monday = new Date('2026-03-02');
        const friday = new Date('2026-03-06');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          contextWithHoliday,
          monday,
          DayPart.ALL,
          friday,
          DayPart.ALL
        );
        expect(result).toBe(1920); // 4 days * 480 (Wed holiday excluded)
      });

      it('should skip non-working days (weekends)', () => {
        const saturday = new Date('2026-03-07');
        const sunday = new Date('2026-03-08');
        const monday = new Date('2026-03-09');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          mockContext,
          saturday,
          DayPart.ALL,
          monday,
          DayPart.ALL
        );
        expect(result).toBe(480); // Only Monday counts
      });
    });

    describe('custom minutesPerDay', () => {
      it('should use custom minutesPerDay for calculations', () => {
        const contextWith6h = {
          ...mockContext,
          minutesPerDay: 360,
        };
        const startDate = new Date('2026-03-02');
        const result = LeaveCalculationService.calculateDurationMinutesWithContext(
          contextWith6h,
          startDate,
          DayPart.ALL,
          startDate,
          DayPart.ALL
        );
        expect(result).toBe(360);
      });
    });
  });

  describe('constants', () => {
    it('should have correct default work hours', () => {
      expect(DEFAULT_WORK_START_HOUR).toBe(9);
      expect(DEFAULT_WORK_END_HOUR).toBe(18);
    });
  });
});
