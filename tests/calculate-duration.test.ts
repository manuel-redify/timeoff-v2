import { calculateDuration, ScheduleData } from '../lib/calculateDuration';
import { DayPart } from '../lib/generated/prisma/enums';

const DEFAULT_SCHEDULE: ScheduleData = {
  monday: 1,
  tuesday: 1,
  wednesday: 1,
  thursday: 1,
  friday: 1,
  saturday: 2,
  sunday: 2,
};

describe('calculateDuration', () => {
  it('calculates a single full working day', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-16'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(1);
  });

  it('calculates multiple full working days (Mon-Fri)', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-20'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(5);
  });

  it('excludes weekends', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-22'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(5);
  });

  it('excludes bank holidays', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-20'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: ['2026-02-18'],
    });
    expect(result).toBe(4);
  });

  it('handles half-day start (MORNING)', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-17'),
      dayPartStart: DayPart.MORNING,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(1.5);
  });

  it('handles half-day end (AFTERNOON)', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-17'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.AFTERNOON,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(1.5);
  });

  it('handles half-day on same day', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-16'),
      dayPartStart: DayPart.MORNING,
      dayPartEnd: DayPart.MORNING,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(0.5);
  });

  it('handles half-day start and half-day end', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-18'),
      dayPartStart: DayPart.AFTERNOON,
      dayPartEnd: DayPart.MORNING,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(2);
  });

  it('returns 0 for a non-working day', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-21'),
      dateEnd: new Date('2026-02-21'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: [],
    });
    expect(result).toBe(0);
  });

  it('respects custom schedule with non-working Wednesday', () => {
    const customSchedule: ScheduleData = {
      ...DEFAULT_SCHEDULE,
      wednesday: 2,
    };
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-20'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: customSchedule,
      bankHolidayDates: [],
    });
    expect(result).toBe(4);
  });

  it('handles morning-only schedule day', () => {
    const customSchedule: ScheduleData = {
      ...DEFAULT_SCHEDULE,
      friday: 3,
    };
    const result = calculateDuration({
      dateStart: new Date('2026-02-20'),
      dateEnd: new Date('2026-02-20'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: customSchedule,
      bankHolidayDates: [],
    });
    expect(result).toBe(0.5);
  });

  it('handles bank holiday on start date', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-18'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: ['2026-02-16'],
    });
    expect(result).toBe(2);
  });

  it('returns 0 when all days are bank holidays', () => {
    const result = calculateDuration({
      dateStart: new Date('2026-02-16'),
      dateEnd: new Date('2026-02-17'),
      dayPartStart: DayPart.ALL,
      dayPartEnd: DayPart.ALL,
      schedule: DEFAULT_SCHEDULE,
      bankHolidayDates: ['2026-02-16', '2026-02-17'],
    });
    expect(result).toBe(0);
  });
});
