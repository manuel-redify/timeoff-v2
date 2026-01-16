import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
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
});

export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return ApiErrors.unauthorized();
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
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

        return successResponse(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        return ApiErrors.internalError();
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return ApiErrors.unauthorized();
        }

        const user = await prisma.user.findUnique({
            where: { clerkId },
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
                validation.error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        const updatedCompany = await prisma.company.update({
            where: { id: user.companyId },
            data: validation.data,
        });

        return successResponse(updatedCompany);

    } catch (error) {
        console.error('Error updating company:', error);
        return ApiErrors.internalError();
    }
}
