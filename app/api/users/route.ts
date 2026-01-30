import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-helper';
import { requireAdmin, handleAuthError } from '@/lib/api-auth';

export async function GET() {
    try {
        const user = await requireAdmin();

        const users = await prisma.user.findMany({
            where: {
                deletedAt: null
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                defaultRole: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                lastname: 'asc'
            }
        });

return successResponse(users);
    } catch (error) {
        return handleAuthError(error);
    }
}
