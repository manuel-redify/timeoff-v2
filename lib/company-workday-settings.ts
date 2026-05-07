import prisma from "@/lib/prisma";
import {
    resolveCompanyWorkdaySettings,
    type CompanyWorkdaySettings,
} from "@/lib/workday-settings";
export {
    DEFAULT_AFTERNOON_START_MINUTES,
    DEFAULT_MINUTES_PER_DAY,
    DEFAULT_MORNING_END_MINUTES,
    DEFAULT_WORKDAY_END_MINUTES,
    DEFAULT_WORKDAY_START_MINUTES,
    getDefaultCompanyWorkdaySettings,
    resolveCompanyWorkdaySettings,
    validateCompanyWorkdaySettings,
    type CompanyWorkdaySettings,
    type CompanyWorkdaySettingsInput,
} from "@/lib/workday-settings";

type CompanyWorkdaySettingsRow = {
    workday_start_minutes: number | null;
    morning_end_minutes: number | null;
    afternoon_start_minutes: number | null;
    workday_end_minutes: number | null;
};

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
