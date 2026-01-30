import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

const addSupervisorSchema = z.object({
    userId: z.string().uuid()
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
            return ApiErrors.forbidden('Only admins can manage supervisors');
        }

        const { id: departmentId } = await params;
        const body = await req.json();
        const validation = addSupervisorSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        const { userId } = validation.data;

        // Verify user belongs to same company
        const targetUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!targetUser || targetUser.companyId !== user.companyId) {
            return ApiErrors.badRequest('User provided does not belong to your company');
        }

        // Verify department belongs to company
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });

        if (!department || department.companyId !== user.companyId) {
            return ApiErrors.notFound('Department not found');
        }

        // Add supervisor
        try {
            await prisma.departmentSupervisor.create({
                data: {
                    departmentId,
                    userId
                }
            });
        } catch (e: any) {
            if (e.code === 'P2002') {
                return ApiErrors.badRequest('User is already a supervisor for this department');
            }
            throw e;
        }

        return successResponse({ added: true }, 'Supervisor added', 201);

    } catch (error) {
        console.error('Error adding supervisor:', error);
        return ApiErrors.internalError();
    }
}
