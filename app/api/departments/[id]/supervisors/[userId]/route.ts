import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
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
            return ApiErrors.forbidden('Only admins can manage supervisors');
        }

        const { id: departmentId, userId } = await params;

        // Verify department belongs to company
        const department = await prisma.department.findUnique({
            where: { id: departmentId }
        });

        if (!department || department.companyId !== user.companyId) {
            return ApiErrors.notFound('Department not found');
        }

        // Delete
        // Use deleteMany to avoid error if not found, or standard delete?
        // Standard delete requires composite ID using `where: { departmentId_userId: { ... } }`
        await prisma.departmentSupervisor.delete({
            where: {
                departmentId_userId: {
                    departmentId,
                    userId
                }
            }
        });

        return successResponse({ removed: true });

    } catch (error: any) {
        if (error.code === 'P2025') {
            return ApiErrors.notFound('Supervisor not found');
        }
        console.error('Error removing supervisor:', error);
        return ApiErrors.internalError();
    }
}
