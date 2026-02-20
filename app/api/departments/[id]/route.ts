import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const updateDepartmentSchema = z.object({
    name: z.string().min(1).optional(),
    allowance: z.number().optional().nullable(),
    includePublicHolidays: z.boolean().optional(),
    isAccruedAllowance: z.boolean().optional(),
    isUnlimitedAllowance: z.boolean().optional(),
    bossId: z.string().uuid().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
const session = await auth();
        if (!session?.user?.id) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        const { id } = await params;

        const department = await prisma.department.findUnique({
            where: { id },
            include: {
                boss: {
                    select: { id: true, name: true, lastname: true }
                },
                supervisors: {
                    include: {
                        user: {
                            select: { id: true, name: true, lastname: true }
                        }
                    }
                }
            }
        });

        if (!department || department.companyId !== user.companyId || department.deletedAt) {
            return ApiErrors.notFound('Department not found');
        }

        return successResponse(department);
    } catch (error) {
        console.error('Error fetching department:', error);
        return ApiErrors.internalError();
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
const session = await auth();
        if (!session?.user?.id) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        if (!user.isAdmin) {
            return ApiErrors.forbidden('Only admins can update departments');
        }

        const { id } = await params;

        // Check existence
        const existing = await prisma.department.findUnique({
            where: { id }
        });

        if (!existing || existing.companyId !== user.companyId || existing.deletedAt) {
            return ApiErrors.notFound('Department not found');
        }

        const body = await req.json();
        const validation = updateDepartmentSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid department data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        const updated = await prisma.department.update({
            where: { id },
            data: validation.data
        });

        revalidatePath('/settings/departments');
        revalidatePath('/api/departments');

        return successResponse(updated);

    } catch (error) {
        console.error('Error updating department:', error);
        return ApiErrors.internalError();
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
const session = await auth();
        if (!session?.user?.id) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        if (!user.isAdmin) {
            return ApiErrors.forbidden('Only admins can delete departments');
        }

        const { id } = await params;

        const existing = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });

        if (!existing || existing.companyId !== user.companyId || existing.deletedAt) {
            return ApiErrors.notFound('Department not found');
        }

        // Check if users exist in department
        if (existing._count.users > 0) {
            return ApiErrors.badRequest('Cannot delete department with assigned users.');
        }

        // Soft delete
        await prisma.department.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        revalidatePath('/settings/departments');
        revalidatePath('/api/departments');

        return successResponse({ deleted: true });

    } catch (error) {
        console.error('Error deleting department:', error);
        return ApiErrors.internalError();
    }
}
