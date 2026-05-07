import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import {
    getCompanyWorkdaySettingsColumns,
    updateCompanyWorkdaySettings,
    validateCompanyWorkdaySettings,
} from '@/lib/company-workday-settings';
import { z } from 'zod';

// Schema for updating company settings
const updateCompanySchema = z.object({
    name: z.string().min(1).optional(),
    country: z.string().length(2).optional(),
    timezone: z.string().min(1).optional(),
    dateFormat: z.string().min(1).optional(),
    startOfNewYear: z.number().int().min(1).max(12).optional(),
    shareAllAbsences: z.boolean().optional(),
    isTeamViewHidden: z.boolean().optional(),
    carryOver: z.number().int().min(0).optional(),
    mode: z.number().int().optional(),
    companyWideMessage: z.string().nullable().optional(),
    isUnlimitedAllowance: z.boolean().optional(),
    allowNegativeAllowance: z.boolean().optional(),
    defaultAllowance: z.number().optional(),
    minutesPerDay: z.number().int().min(1).max(1440).optional(),
    workdayStartMinutes: z.number().int().min(0).max(1439).optional(),
    morningEndMinutes: z.number().int().min(1).max(1440).optional(),
    afternoonStartMinutes: z.number().int().min(0).max(1439).optional(),
    workdayEndMinutes: z.number().int().min(1).max(1440).optional(),
});

export async function GET(req: NextRequest) {
    try {
const session = await auth();
        if (!session?.user?.id) {
            return ApiErrors.unauthorized();
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
        });

        if (!company) {
            return ApiErrors.notFound('Company not found');
        }

        // Only admins or if RLS allows (currently public read within company)
        // PRD says "companywide settings", but read might be needed for everyone for some fields (timezone, dateFormat).
        // PATCH is admin only.

        const workdaySettings = await getCompanyWorkdaySettingsColumns(user.companyId);

        return successResponse({
            ...company,
            ...workdaySettings,
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        return ApiErrors.internalError();
    }
}

export async function PATCH(req: NextRequest) {
    try {
const session = await auth();
        if (!session?.user?.id) {
            return ApiErrors.unauthorized();
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        if (!user.isAdmin) {
            return ApiErrors.forbidden('Only admins can update company settings');
        }

        const body = await req.json();
        const validation = updateCompanySchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid settings data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        const hasWorkdaySettingsUpdate = [
            validation.data.workdayStartMinutes,
            validation.data.morningEndMinutes,
            validation.data.afternoonStartMinutes,
            validation.data.workdayEndMinutes,
        ].some((value) => typeof value === 'number');

        const validatedSettings = hasWorkdaySettingsUpdate
            ? validateCompanyWorkdaySettings({
                minutesPerDay: validation.data.minutesPerDay,
                workdayStartMinutes: validation.data.workdayStartMinutes,
                morningEndMinutes: validation.data.morningEndMinutes,
                afternoonStartMinutes: validation.data.afternoonStartMinutes,
                workdayEndMinutes: validation.data.workdayEndMinutes,
            })
            : null;

        if (validatedSettings && !validatedSettings.isValid) {
            return ApiErrors.badRequest(
                'Invalid workday settings',
                validatedSettings.errors.map((message) => ({
                    field: 'workdaySettings',
                    message,
                    code: 'VALIDATION_ERROR',
                }))
            );
        }

        const {
            workdayStartMinutes,
            morningEndMinutes,
            afternoonStartMinutes,
            workdayEndMinutes,
            ...companyData
        } = validation.data;

        const updatedCompany = await prisma.company.update({
            where: { id: user.companyId },
            data: {
                ...companyData,
                ...(validatedSettings
                    ? { minutesPerDay: validatedSettings.settings.minutesPerDay }
                    : {}),
            },
        });

        if (validatedSettings) {
            await updateCompanyWorkdaySettings(user.companyId, validatedSettings.settings);
        }

        return successResponse({
            ...updatedCompany,
            ...(validatedSettings
                ? {
                    workdayStartMinutes: validatedSettings.settings.workdayStartMinutes,
                    morningEndMinutes: validatedSettings.settings.morningEndMinutes,
                    afternoonStartMinutes: validatedSettings.settings.afternoonStartMinutes,
                    workdayEndMinutes: validatedSettings.settings.workdayEndMinutes,
                }
                : await getCompanyWorkdaySettingsColumns(user.companyId)),
        });

    } catch (error) {
        console.error('Error updating company:', error);
        return ApiErrors.internalError();
    }
}
