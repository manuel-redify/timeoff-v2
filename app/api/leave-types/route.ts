import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const createLeaveTypeSchema = z.object({
    name: z.string().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#ffffff'),
    useAllowance: z.boolean().default(true),
    limit: z.number().int().min(0).max(365).optional().nullable(),
    sortOrder: z.number().int().default(0),
    autoApprove: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
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

        const leaveTypes = await prisma.leaveType.findMany({
            where: {
                companyId: user.companyId,
                deletedAt: null
            },
            orderBy: [
                { sortOrder: 'asc' },
                { name: 'asc' }
            ]
        });

        return successResponse(leaveTypes);
    } catch (error) {
        console.error('Error fetching leave types:', error);
        return ApiErrors.internalError();
    }
}

export async function POST(req: NextRequest) {
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
            return ApiErrors.forbidden('Only admins can create leave types');
        }

        const body = await req.json();
        const validation = createLeaveTypeSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid leave type data',
                validation.error.issues.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        const { name, color, useAllowance, limit, sortOrder, autoApprove } = validation.data;

        // Check for duplicate active leave type with same name
        const duplicate = await prisma.leaveType.findFirst({
            where: {
                companyId: user.companyId,
                name: name,
                deletedAt: null
            }
        });

        if (duplicate) {
            return ApiErrors.badRequest('Leave type with this name already exists');
        }

        const leaveType = await prisma.leaveType.create({
            data: {
                companyId: user.companyId,
                name,
                color,
                useAllowance,
                limit,
                sortOrder,
                autoApprove
            }
        });

        revalidatePath('/settings/leave-types');
        revalidatePath('/api/leave-types');

        return successResponse(leaveType, 'Leave type created', 201);

    } catch (error) {
        console.error('Error creating leave type:', error);
        return ApiErrors.internalError();
    }
}
