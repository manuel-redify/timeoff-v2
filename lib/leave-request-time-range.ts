import { DayPart } from '@/lib/generated/prisma/enums';
import {
    DEFAULT_WORK_END_HOUR,
    DEFAULT_WORK_START_HOUR,
} from '@/lib/leave-calculation-service';
import {
    DEFAULT_AFTERNOON_START_MINUTES,
    DEFAULT_MORNING_END_MINUTES,
    resolveCompanyWorkdaySettings,
    type CompanyWorkdaySettingsInput,
} from '@/lib/workday-settings';

type TimeSelection = {
    hours: number;
    minutes: number;
};

export function resolveWorkdayBounds(
    input?: number | CompanyWorkdaySettingsInput | null
) {
    const normalizedInput =
        typeof input === 'number'
            ? { minutesPerDay: input }
            : input;
    const resolved = resolveCompanyWorkdaySettings({
        workdayStartMinutes: normalizedInput?.workdayStartMinutes ?? DEFAULT_WORK_START_HOUR * 60,
        morningEndMinutes: normalizedInput?.morningEndMinutes ?? DEFAULT_MORNING_END_MINUTES,
        afternoonStartMinutes: normalizedInput?.afternoonStartMinutes ?? DEFAULT_AFTERNOON_START_MINUTES,
        workdayEndMinutes: normalizedInput?.workdayEndMinutes ?? DEFAULT_WORK_END_HOUR * 60,
        minutesPerDay: normalizedInput?.minutesPerDay,
    });

    return {
        startMinutes: resolved.workdayStartMinutes,
        morningEndMinutes: resolved.morningEndMinutes,
        afternoonStartMinutes: resolved.afternoonStartMinutes,
        endMinutes: resolved.workdayEndMinutes,
        totalMinutes: resolved.minutesPerDay,
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
    workdaySettings?: number | CompanyWorkdaySettingsInput | null,
    startTime?: TimeSelection,
    endTime?: TimeSelection
) {
    const workday = resolveWorkdayBounds(workdaySettings);
    const isCustomRange = Boolean(startTime && endTime);

    if (isCustomRange) {
        return {
            persistedDateStart: applyTimeToDate(dateStart, startTime!.hours * 60 + startTime!.minutes),
            persistedDateEnd: applyTimeToDate(dateEnd, endTime!.hours * 60 + endTime!.minutes),
        };
    }

    const startOffset =
        dayPartStart === DayPart.AFTERNOON
            ? workday.afternoonStartMinutes
            : workday.startMinutes;
    const endOffset =
        dayPartEnd === DayPart.MORNING
            ? workday.morningEndMinutes
            : workday.endMinutes;

    return {
        persistedDateStart: applyTimeToDate(dateStart, startOffset),
        persistedDateEnd: applyTimeToDate(dateEnd, endOffset),
    };
}
