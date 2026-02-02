import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

// Schema for updating areas
const updateAreaSchema = z.object({
    name: z.string().min(1, 'Area name is required').optional(),
});

// PUT - Update an existing area
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
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
            return ApiErrors.forbidden('Only admins can update areas');
        }

        const body = await req.json();
        const validation = updateAreaSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid area data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        // Check if area exists and belongs to company
        const existingArea = await prisma.area.findFirst({
            where: {
                id: resolvedParams.id,
                companyId: user.companyId,
            }
        });

        if (!existingArea) {
            return ApiErrors.notFound('Area not found');
        }

        // If updating name, check for duplicates
        if (validation.data.name) {
            const duplicateArea = await prisma.area.findFirst({
                where: {
                    name: validation.data.name,
                    companyId: user.companyId,
                    id: { not: resolvedParams.id }
                }
            });

            if (duplicateArea) {
                return ApiErrors.badRequest('Area with this name already exists');
            }
        }

        const updatedArea = await prisma.area.update({
            where: { id: resolvedParams.id },
            data: validation.data,
        });

        return successResponse(updatedArea);

    } catch (error) {
        console.error('Error updating area:', error);
        return ApiErrors.internalError();
    }
}

// DELETE - Delete an area
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
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
            return ApiErrors.forbidden('Only admins can delete areas');
        }

        // Check if area exists and belongs to company
        const existingArea = await prisma.area.findFirst({
            where: {
                id: resolvedParams.id,
                companyId: user.companyId,
            }
        });

        if (!existingArea) {
            return ApiErrors.notFound('Area not found');
        }

        // Check if area is being used
        const areaUsage = await prisma.area.findUnique({
            where: { id: resolvedParams.id },
            select: {
                _count: {
                    select: {
                        users: true,
                        approvalRules: true,
                    }
                }
            }
        });

        const totalUsage = areaUsage ? Object.values(areaUsage._count).reduce((sum: number, count: number) => sum + count, 0) : 0;

        if (totalUsage > 0) {
            return ApiErrors.badRequest('Cannot delete area that is in use. Remove users and approval rules first.');
        }

        await prisma.area.delete({
            where: { id: resolvedParams.id },
        });

        return successResponse({ message: 'Area deleted successfully' });

    } catch (error) {
        console.error('Error deleting area:', error);
        return ApiErrors.internalError();
    }
}