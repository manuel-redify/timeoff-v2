import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';
import { importHolidays } from '@/lib/holiday-service';

const importSchema = z.object({
    country: z.string().length(2)
});

export async function POST(req: NextRequest) {
    try {
const session = await auth();
        if (!session?.user?.id) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true }
        });

        if (!user || !user.companyId) return ApiErrors.unauthorized();
        if (!user.isAdmin) return ApiErrors.forbidden();

        const body = await req.json();
        const validation = importSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid country',
                (validation.error as any).errors.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
            );
        }

        const { country } = validation.data;

        const count = await importHolidays(user.companyId, country);

        return successResponse({ imported: count });

    } catch (error) {
        console.error('Error importing holidays:', error);
        return ApiErrors.internalError();
    }
}
