import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

// Schema for creating areas
const createAreaSchema = z.object({
    name: z.string().min(1, 'Area name is required'),
});

// GET - Fetch all areas for the company with user counts
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

        if (!user.isAdmin) {
            return ApiErrors.forbidden('Only admins can view areas');
        }

        const areas = await prisma.area.findMany({
            where: {
                companyId: user.companyId,
            },
            orderBy: [
                { name: 'asc' }
            ],
            include: {
                users: {
                    where: {
                        deletedAt: null
                    },
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                }
            }
        });

        // Format the response with counts
        const formattedAreas = areas.map(area => {
            return {
                ...area,
                _count: {
                    users: area.users?.length || 0
                }
            };
        });

        return successResponse(formattedAreas);

    } catch (error) {
        console.error('Error fetching areas:', error);
        return ApiErrors.internalError();
    }
}

// POST - Create a new area
export async function POST(req: NextRequest) {
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
            return ApiErrors.forbidden('Only admins can create areas');
        }

        const body = await req.json();
        const validation = createAreaSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid area data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        // Check if area name already exists for this company
        const existingArea = await prisma.area.findFirst({
            where: {
                name: validation.data.name,
                companyId: user.companyId,
            }
        });

        if (existingArea) {
            return ApiErrors.badRequest('Area with this name already exists');
        }

        const area = await prisma.area.create({
            data: {
                ...validation.data,
                companyId: user.companyId,
            }
        });

        return successResponse(area);

    } catch (error) {
        console.error('Error creating area:', error);
        return ApiErrors.internalError();
    }
}