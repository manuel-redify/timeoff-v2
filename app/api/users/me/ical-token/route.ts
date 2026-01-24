import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';
import { successResponse, ApiErrors } from '@/lib/api-helper';
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return ApiErrors.unauthorized();

        const newToken = crypto.randomUUID();

        await prisma.user.update({
            where: { id: user.id },
            data: { icalFeedToken: newToken }
        });

        return successResponse({ token: newToken });
    } catch (error) {
        console.error('Error regenerating iCal token:', error);
        return ApiErrors.internalError();
    }
}
