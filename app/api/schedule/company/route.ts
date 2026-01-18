import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const scheduleSchema = z.object({
    monday: z.number().int().min(1).max(4).default(1),
    tuesday: z.number().int().min(1).max(4).default(1),
    wednesday: z.number().int().min(1).max(4).default(1),
    thursday: z.number().int().min(1).max(4).default(1),
    friday: z.number().int().min(1).max(4).default(1),
    saturday: z.number().int().min(1).max(4).default(2),
    sunday: z.number().int().min(1).max(4).default(2),
});

export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true }
        });

        if (!user || !user.companyId) return ApiErrors.unauthorized();

        const schedule = await prisma.schedule.findFirst({
            where: {
                companyId: user.companyId,
                userId: null
            }
        });

        return successResponse(schedule);
    } catch (error) {
        console.error('Error fetching company schedule:', error);
        return ApiErrors.internalError();
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true }
        });

        if (!user || !user.companyId) return ApiErrors.unauthorized();
        if (!user.isAdmin) return ApiErrors.forbidden();

        const body = await req.json();
        const validation = scheduleSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid schedule',
                (validation.error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
            );
        }

        // Upsert
        // find existing schedule for company
        const existing = await prisma.schedule.findFirst({
            where: {
                companyId: user.companyId,
                userId: null
            }
        });

        let result;
        if (existing) {
            result = await prisma.schedule.update({
                where: { id: existing.id },
                data: validation.data
            });
        } else {
            result = await prisma.schedule.create({
                data: {
                    companyId: user.companyId,
                    userId: null,
                    ...validation.data
                }
            });
        }

        return successResponse(result);

    } catch (error) {
        console.error('Error updating company schedule:', error);
        return ApiErrors.internalError();
    }
}
