import { eachDayOfInterval, getDay, format, isSameDay } from 'date-fns';
import { DayPart } from '@/lib/generated/prisma/enums';

export interface ScheduleData {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface CalculateDurationParams {
  dateStart: Date;
  dateEnd: Date;
  dayPartStart: DayPart;
  dayPartEnd: DayPart;
  schedule: ScheduleData;
  bankHolidayDates: string[];
}

function getScheduleValueForDate(schedule: ScheduleData, date: Date): number {
  const dayOfWeek = getDay(date);
  switch (dayOfWeek) {
    case 0: return schedule.sunday;
    case 1: return schedule.monday;
    case 2: return schedule.tuesday;
    case 3: return schedule.wednesday;
    case 4: return schedule.thursday;
    case 5: return schedule.friday;
    case 6: return schedule.saturday;
    default: return 2;
  }
}

export function calculateDuration(params: CalculateDurationParams): number {
  const { dateStart, dateEnd, dayPartStart, dayPartEnd, schedule, bankHolidayDates } = params;

  const interval = eachDayOfInterval({ start: dateStart, end: dateEnd });
  let totalDays = 0;

  for (const date of interval) {
    const dateStr = format(date, 'yyyy-MM-dd');

    const scheduleValue = getScheduleValueForDate(schedule, date);
    const isWorkingFull = scheduleValue === 1;
    const isMorningOnly = scheduleValue === 3;
    const isAfternoonOnly = scheduleValue === 4;
    const isNonWorking = scheduleValue === 2;

    if (isNonWorking) continue;

    if (bankHolidayDates.includes(dateStr)) continue;

    let dayWeight = 0;
    if (isWorkingFull) dayWeight = 1.0;
    else if (isMorningOnly || isAfternoonOnly) dayWeight = 0.5;

    const isStart = isSameDay(date, dateStart);
    const isEnd = isSameDay(date, dateEnd);

    if (isStart && isEnd) {
      if (dayPartStart === DayPart.ALL && dayPartEnd === DayPart.ALL) {
        totalDays += dayWeight;
      } else {
        totalDays += Math.min(0.5, dayWeight);
      }
    } else if (isStart) {
      if (dayPartStart === DayPart.ALL) {
        totalDays += dayWeight;
      } else {
        totalDays += Math.min(0.5, dayWeight);
      }
    } else if (isEnd) {
      if (dayPartEnd === DayPart.ALL) {
        totalDays += dayWeight;
      } else {
        totalDays += Math.min(0.5, dayWeight);
      }
    } else {
      totalDays += dayWeight;
    }
  }

  return totalDays;
}
