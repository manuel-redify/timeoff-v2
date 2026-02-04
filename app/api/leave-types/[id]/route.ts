import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const updateLeaveTypeSchema = z.object({
    name: z.string().min(1).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    useAllowance: z.boolean().optional(),
    limit: z.number().int().min(0).max(365).optional().nullable(),
    sortOrder: z.number().int().optional(),
    autoApprove: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
const session = await auth();
        if (!session?.user?.id) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        const leaveType = await prisma.leaveType.findUnique({
            where: { id }
        });

        if (!leaveType || leaveType.companyId !== user.companyId) {
            return ApiErrors.notFound('Leave type not found');
        }

        return successResponse(leaveType);
    } catch (error) {
        console.error('Error fetching leave type:', error);
        return ApiErrors.internalError();
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
const session = await auth();
        if (!session?.user?.id) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, isAdmin: true },
        });

        if (!user || !user.companyId || !user.isAdmin) {
            return ApiErrors.forbidden('Only admins can update leave types');
        }

        const body = await req.json();
        const validation = updateLeaveTypeSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid leave type data',
                validation.error.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        // Check if leave type exists and belongs to company
        const existing = await prisma.leaveType.findUnique({
            where: { id }
        });

if (!existing || existing.companyId !== user.companyId) {
            return ApiErrors.notFound('Leave type not found');
        }

        // Check for duplicate name if name is being changed
        if (validation.data.name && validation.data.name !== existing.name) {
            const duplicate = await prisma.leaveType.findFirst({
                where: {
                    companyId: user.companyId,
                    name: validation.data.name,
                    id: { not: id },
                }
            });
            if (duplicate) {
                return ApiErrors.badRequest('Leave type with this name already exists');
            }
        }

// Dependency Check: prevent deletion if used by any leave requests
        const existingWithCount = await prisma.leaveType.findFirst({
            where: { id },
            include: { _count: { select: { leaveRequests: true } } }
        });

        if (!existing || existing.companyId !== user.companyId) {
            return ApiErrors.notFound('Leave type not found');
        }

        // Dependency Check: prevent deletion if used by any leave requests
        if (existingWithCount?._count?.leaveRequests && existingWithCount._count.leaveRequests > 0) {
            return ApiErrors.badRequest('Cannot delete leave type that is in use by leave requests');
        }

        // Delete
        await prisma.leaveType.delete({
            where: { id }
        });

        if (!existing || existing.companyId !== user.companyId) {
            return ApiErrors.notFound('Leave type not found');
        }

// Dependency Check: prevent deletion if used by any leave requests
        if (existingWithCount?._count?.leaveRequests && existingWithCount._count.leaveRequests > 0) {
            return ApiErrors.badRequest('Cannot delete leave type that is in use by leave requests');
        }

        // Delete
        await prisma.leaveType.delete({
            where: { id }
        });

        revalidatePath('/settings/leave-types');
        revalidatePath('/api/leave-types');

        return successResponse(null, 'Leave type deleted');
    } catch (error) {
        console.error('Error deleting leave type:', error);
        return ApiErrors.internalError();
    }
}
