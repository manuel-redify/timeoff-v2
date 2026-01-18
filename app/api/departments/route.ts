import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const createDepartmentSchema = z.object({
    name: z.string().min(1),
    allowance: z.number().optional(), // Decimal as number in JSON
    includePublicHolidays: z.boolean().optional(),
    isAccruedAllowance: z.boolean().optional(),
    bossId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        const departments = await prisma.department.findMany({
            where: {
                companyId: user.companyId,
                deletedAt: null
            },
            include: {
                boss: {
                    select: { id: true, name: true, lastname: true }
                },
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return successResponse(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return ApiErrors.internalError();
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return ApiErrors.unauthorized();

        const user = await prisma.user.findUnique({
            where: { clerkId },
            select: { companyId: true, isAdmin: true },
        });

        if (!user || !user.companyId) {
            return ApiErrors.unauthorized('User not associated with a company');
        }

        if (!user.isAdmin) {
            return ApiErrors.forbidden('Only admins can create departments');
        }

        const body = await req.json();
        const validation = createDepartmentSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid department data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        const { name, allowance, includePublicHolidays, isAccruedAllowance, bossId } = validation.data;

        // Check for duplicate active department with same name
        const duplicate = await prisma.department.findFirst({
            where: {
                companyId: user.companyId,
                name: name,
                deletedAt: null
            }
        });

        if (duplicate) {
            return ApiErrors.badRequest('Department with this name already exists');
        }

        const department = await prisma.department.create({
            data: {
                companyId: user.companyId,
                name,
                allowance,
                includePublicHolidays: includePublicHolidays ?? true,
                isAccruedAllowance: isAccruedAllowance ?? false,
                bossId
            }
        });

        revalidatePath('/settings/departments');
        revalidatePath('/api/departments');

        return successResponse(department, 'Department created', 201);

    } catch (error) {
        console.error('Error creating department:', error);
        return ApiErrors.internalError();
    }
}
