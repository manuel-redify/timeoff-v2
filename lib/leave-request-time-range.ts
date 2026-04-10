import { DayPart } from '@/lib/generated/prisma/enums';
import {
    DEFAULT_WORK_START_HOUR,
    DEFAULT_WORK_END_HOUR,
} from '@/lib/leave-calculation-service';

type TimeSelection = {
    hours: number;
    minutes: number;
};

export function resolveWorkdayBounds(minutesPerDay?: number | null) {
    const startMinutes = DEFAULT_WORK_START_HOUR * 60;
    const fallbackEndMinutes = DEFAULT_WORK_END_HOUR * 60;
    const effectiveMinutesPerDay =
        typeof minutesPerDay === 'number' && minutesPerDay > 0
            ? minutesPerDay
            : fallbackEndMinutes - startMinutes;

    return {
        startMinutes,
        endMinutes: startMinutes + effectiveMinutesPerDay,
        totalMinutes: effectiveMinutesPerDay,
    };
}

export function applyTimeToDate(dateInput: string | Date, totalMinutes: number): Date {
    const date = (() => {
        if (dateInput instanceof Date) {
            return new Date(
                dateInput.getFullYear(),
                dateInput.getMonth(),
                dateInput.getDate()
            );
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            const [year, month, day] = dateInput.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        const parsed = new Date(dateInput);
        return new Date(
            parsed.getFullYear(),
            parsed.getMonth(),
            parsed.getDate()
        );
    })();
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    date.setHours(hours, minutes, 0, 0);
    return date;
}

export function getPresetDateRange(
    dateStart: string | Date,
    dateEnd: string | Date,
    dayPartStart: DayPart,
    dayPartEnd: DayPart,
    minutesPerDay?: number | null,
    startTime?: TimeSelection,
    endTime?: TimeSelection
) {
    const workday = resolveWorkdayBounds(minutesPerDay);
    const halfDayMinutes = Math.round(workday.totalMinutes / 2);
    const isCustomRange = Boolean(startTime && endTime);

    if (isCustomRange) {
        return {
            persistedDateStart: applyTimeToDate(dateStart, startTime!.hours * 60 + startTime!.minutes),
            persistedDateEnd: applyTimeToDate(dateEnd, endTime!.hours * 60 + endTime!.minutes),
        };
    }

    const startOffset =
        dayPartStart === DayPart.AFTERNOON
            ? workday.startMinutes + halfDayMinutes
            : workday.startMinutes;
    const endOffset =
        dayPartEnd === DayPart.MORNING
            ? workday.startMinutes + halfDayMinutes
            : workday.endMinutes;

    return {
        persistedDateStart: applyTimeToDate(dateStart, startOffset),
        persistedDateEnd: applyTimeToDate(dateEnd, endOffset),
    };
}
