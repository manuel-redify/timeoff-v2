import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

// Schema for updating roles
const updateRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required').optional(),
    priorityWeight: z.coerce.number().int().min(0).optional(),
});

// PUT - Update an existing role
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
            return ApiErrors.forbidden('Only admins can update roles');
        }

        const body = await req.json();
        const validation = updateRoleSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid role data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        // Check if role exists and belongs to company
        const existingRole = await prisma.role.findFirst({
            where: {
                id: resolvedParams.id,
                companyId: user.companyId,
            }
        });

        if (!existingRole) {
            return ApiErrors.notFound('Role not found');
        }

        // If updating name, check for duplicates
        if (validation.data.name) {
            const duplicateRole = await prisma.role.findFirst({
                where: {
                    name: validation.data.name,
                    companyId: user.companyId,
                    id: { not: resolvedParams.id }
                }
            });

            if (duplicateRole) {
                return ApiErrors.badRequest('Role with this name already exists');
            }
        }

        const updatedRole = await prisma.role.update({
            where: { id: resolvedParams.id },
            data: validation.data,
        });

        return successResponse(updatedRole);

    } catch (error) {
        console.error('Error updating role:', error);
        return ApiErrors.internalError();
    }
}

// DELETE - Delete a role
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
            return ApiErrors.forbidden('Only admins can delete roles');
        }

        // Check if role exists and belongs to company
        const existingRole = await prisma.role.findFirst({
            where: {
                id: resolvedParams.id,
                companyId: user.companyId,
            }
        });

        if (!existingRole) {
            return ApiErrors.notFound('Role not found');
        }

        // Check if role is being used
        const roleUsage = await prisma.role.findUnique({
            where: { id: resolvedParams.id },
            select: {
                _count: {
                    select: {
                        userRoleAreas: true,
                        usersDefault: true,
                        approvalRulesApp: true,
                        approvalRulesSub: true,
                        approvalSteps: true,
                        companiesDefault: true,
                        userProjects: true,
                        watcherRules: true,
                    }
                }
            }
        });

        const totalUsage = roleUsage ? Object.values(roleUsage._count).reduce((sum: number, count: number) => sum + count, 0) : 0;

        if (totalUsage > 0) {
            return ApiErrors.badRequest('Cannot delete role that is in use');
        }

        await prisma.role.delete({
            where: { id: resolvedParams.id },
        });

        return successResponse({ message: 'Role deleted successfully' });

    } catch (error) {
        console.error('Error deleting role:', error);
        return ApiErrors.internalError();
    }
}