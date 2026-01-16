import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';
import { importHolidays } from '@/lib/holiday-service';

const createHolidaySchema = z.object({
    name: z.string().min(1),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)), // ISO or YYYY-MM-DD
});

const importSchema = z.object({
    country: z.string().length(2)
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

        const { searchParams } = new URL(req.url);
        const year = searchParams.get('year');

        const where: any = { companyId: user.companyId };

        if (year) {
            const start = new Date(`${year}-01-01`);
            const end = new Date(`${year}-12-31`);
            where.date = {
                gte: start,
                lte: end
            }
        }

        const holidays = await prisma.bankHoliday.findMany({
            where,
            orderBy: { date: 'asc' }
        });

        return successResponse(holidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return ApiErrors.internalError();
    }
}

export async function POST(req: NextRequest) {
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
        const validation = createHolidaySchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid data',
                validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            );
        }

        const { name, date } = validation.data;
        const dateObj = new Date(date);

        const holiday = await prisma.bankHoliday.create({
            data: {
                companyId: user.companyId,
                name,
                date: dateObj,
                country: 'XX' // Manual
            }
        });

        return successResponse(holiday, 'Holiday created', 201);

    } catch (error) {
        console.error('Error creating holiday:', error);
        return ApiErrors.internalError();
    }
}
