import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const updateHolidaySchema = z.object({
    name: z.string().min(1).optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true }
        });

        if (!user || !user.companyId) return ApiErrors.unauthorized();
        if (!user.isAdmin) return ApiErrors.forbidden();

        const { id } = await params;
        const body = await req.json();
        const validation = updateHolidaySchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid data',
                validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
            );
        }

        const existing = await prisma.bankHoliday.findUnique({ where: { id } });
        if (!existing || existing.companyId !== user.companyId) {
            return ApiErrors.notFound('Holiday not found');
        }

        const updated = await prisma.bankHoliday.update({
            where: { id },
            data: {
                ...validation.data,
                date: validation.data.date ? new Date(validation.data.date) : undefined
            }
        });

        return successResponse(updated);

    } catch (error) {
        console.error('Error updating holiday:', error);
        return ApiErrors.internalError();
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true }
        });

        if (!user || !user.companyId) return ApiErrors.unauthorized();
        if (!user.isAdmin) return ApiErrors.forbidden();

        const { id } = await params;

        const existing = await prisma.bankHoliday.findUnique({ where: { id } });
        if (!existing || existing.companyId !== user.companyId) {
            return ApiErrors.notFound('Holiday not found');
        }

        await prisma.bankHoliday.delete({ where: { id } });

        return successResponse({ deleted: true });

    } catch (error) {
        console.error('Error deleting holiday:', error);
        return ApiErrors.internalError();
    }
}
