import prisma from "@/lib/prisma";

export const DEFAULT_WORKDAY_START_MINUTES = 9 * 60;
export const DEFAULT_MORNING_END_MINUTES = 13 * 60;
export const DEFAULT_AFTERNOON_START_MINUTES = 14 * 60;
export const DEFAULT_WORKDAY_END_MINUTES = 18 * 60;
export const DEFAULT_MINUTES_PER_DAY = 8 * 60;

type CompanyWorkdaySettingsRow = {
    workday_start_minutes: number | null;
    morning_end_minutes: number | null;
    afternoon_start_minutes: number | null;
    workday_end_minutes: number | null;
};

export interface CompanyWorkdaySettingsInput {
    workdayStartMinutes?: number | null;
    morningEndMinutes?: number | null;
    afternoonStartMinutes?: number | null;
    workdayEndMinutes?: number | null;
    minutesPerDay?: number | null;
}

export interface CompanyWorkdaySettings {
    workdayStartMinutes: number;
    morningEndMinutes: number;
    afternoonStartMinutes: number;
    workdayEndMinutes: number;
    minutesPerDay: number;
    morningMinutes: number;
    afternoonMinutes: number;
    lunchBreakMinutes: number;
}

export function getDefaultCompanyWorkdaySettings(): CompanyWorkdaySettings {
    return resolveCompanyWorkdaySettings({
        workdayStartMinutes: DEFAULT_WORKDAY_START_MINUTES,
        morningEndMinutes: DEFAULT_MORNING_END_MINUTES,
        afternoonStartMinutes: DEFAULT_AFTERNOON_START_MINUTES,
        workdayEndMinutes: DEFAULT_WORKDAY_END_MINUTES,
        minutesPerDay: DEFAULT_MINUTES_PER_DAY,
    });
}

export function resolveCompanyWorkdaySettings(
    input?: CompanyWorkdaySettingsInput | null
): CompanyWorkdaySettings {
    const workdayStartMinutes = input?.workdayStartMinutes ?? DEFAULT_WORKDAY_START_MINUTES;
    const morningEndMinutes = input?.morningEndMinutes ?? DEFAULT_MORNING_END_MINUTES;
    const afternoonStartMinutes = input?.afternoonStartMinutes ?? DEFAULT_AFTERNOON_START_MINUTES;
    const workdayEndMinutes = input?.workdayEndMinutes ?? DEFAULT_WORKDAY_END_MINUTES;

    const morningMinutes = Math.max(morningEndMinutes - workdayStartMinutes, 0);
    const afternoonMinutes = Math.max(workdayEndMinutes - afternoonStartMinutes, 0);
    const lunchBreakMinutes = Math.max(afternoonStartMinutes - morningEndMinutes, 0);
    const derivedMinutesPerDay = morningMinutes + afternoonMinutes;
    const fallbackMinutesPerDay = input?.minutesPerDay ?? DEFAULT_MINUTES_PER_DAY;

    return {
        workdayStartMinutes,
        morningEndMinutes,
        afternoonStartMinutes,
        workdayEndMinutes,
        minutesPerDay: derivedMinutesPerDay > 0 ? derivedMinutesPerDay : fallbackMinutesPerDay,
        morningMinutes,
        afternoonMinutes,
        lunchBreakMinutes,
    };
}

export function validateCompanyWorkdaySettings(input: CompanyWorkdaySettingsInput) {
    const errors: string[] = [];
    const normalized = resolveCompanyWorkdaySettings(input);

    if (normalized.workdayStartMinutes >= normalized.morningEndMinutes) {
        errors.push("Morning end must be after workday start.");
    }

    if (normalized.morningEndMinutes > normalized.afternoonStartMinutes) {
        errors.push("Afternoon start must be at or after morning end.");
    }

    if (normalized.afternoonStartMinutes >= normalized.workdayEndMinutes) {
        errors.push("Workday end must be after afternoon start.");
    }

    if (normalized.morningMinutes <= 0 || normalized.afternoonMinutes <= 0) {
        errors.push("Morning and afternoon segments must both have a positive duration.");
    }

    if (
        typeof input.minutesPerDay === "number" &&
        input.minutesPerDay > 0 &&
        normalized.minutesPerDay !== input.minutesPerDay
    ) {
        errors.push("Paid work minutes per day must match the configured morning and afternoon slots.");
    }

    return {
        isValid: errors.length === 0,
        errors,
        settings: normalized,
    };
}

export async function getCompanyWorkdaySettings(companyId: string, minutesPerDay?: number | null) {
    const rows = await prisma.$queryRaw<CompanyWorkdaySettingsRow[]>`
        SELECT
            workday_start_minutes,
            morning_end_minutes,
            afternoon_start_minutes,
            workday_end_minutes
        FROM companies
        WHERE id = ${companyId}
          AND deleted_at IS NULL
        LIMIT 1
    `;

    const row = rows[0];
    return resolveCompanyWorkdaySettings({
        workdayStartMinutes: row?.workday_start_minutes,
        morningEndMinutes: row?.morning_end_minutes,
        afternoonStartMinutes: row?.afternoon_start_minutes,
        workdayEndMinutes: row?.workday_end_minutes,
        minutesPerDay,
    });
}

export async function getCompanyWorkdaySettingsColumns(companyId: string) {
    const rows = await prisma.$queryRaw<CompanyWorkdaySettingsRow[]>`
        SELECT
            workday_start_minutes,
            morning_end_minutes,
            afternoon_start_minutes,
            workday_end_minutes
        FROM companies
        WHERE id = ${companyId}
          AND deleted_at IS NULL
        LIMIT 1
    `;

    const row = rows[0];
    return {
        workdayStartMinutes: row?.workday_start_minutes ?? null,
        morningEndMinutes: row?.morning_end_minutes ?? null,
        afternoonStartMinutes: row?.afternoon_start_minutes ?? null,
        workdayEndMinutes: row?.workday_end_minutes ?? null,
    };
}

export async function updateCompanyWorkdaySettings(
    companyId: string,
    settings: CompanyWorkdaySettings
) {
    await prisma.$executeRaw`
        UPDATE companies
        SET
            workday_start_minutes = ${settings.workdayStartMinutes},
            morning_end_minutes = ${settings.morningEndMinutes},
            afternoon_start_minutes = ${settings.afternoonStartMinutes},
            workday_end_minutes = ${settings.workdayEndMinutes}
        WHERE id = ${companyId}
    `;
}
