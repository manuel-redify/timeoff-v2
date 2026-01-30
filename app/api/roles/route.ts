import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { ApiErrors, successResponse } from '@/lib/api-helper';
import { z } from 'zod';

// Schema for creating roles
const createRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required'),
    priorityWeight: z.coerce.number().int().min(0).default(0),
});

// Schema for updating roles
const updateRoleSchema = z.object({
    name: z.string().min(1, 'Role name is required').optional(),
    priorityWeight: z.coerce.number().int().min(0).optional(),
});

// GET - Fetch all roles for the company
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
            return ApiErrors.forbidden('Only admins can view roles');
        }

        const roles = await prisma.role.findMany({
            where: {
                companyId: user.companyId,
            },
            orderBy: [
                { priorityWeight: 'desc' },
                { name: 'asc' }
            ],
            include: {
                userRoleAreas: {
                    select: {
                        id: true,
                        area: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                usersDefault: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        email: true
                    }
                }
            }
        });

        // Get user counts for each role separately for accuracy
        const roleIds = roles.map(r => r.id);
        const userCountsByRole = await prisma.user.groupBy({
            by: ['defaultRoleId'],
            where: {
                companyId: user.companyId,
                defaultRoleId: {
                    in: roleIds
                },
                deletedAt: null
            },
            _count: true
        });

        const userCountMap = userCountsByRole.reduce((acc: Record<string, number>, item) => {
            if (item.defaultRoleId) {
                acc[item.defaultRoleId] = item._count;
            }
            return acc;
        }, {});

        // Format the response with actual counts
        const formattedRoles = roles.map(role => ({
            ...role,
            _count: {
                userRoleAreas: role.userRoleAreas?.length || 0,
                usersDefault: userCountMap[role.id] || 0
            }
        }));

        return successResponse(roles);

    } catch (error) {
        console.error('Error fetching roles:', error);
        return ApiErrors.internalError();
    }
}

// POST - Create a new role
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
            return ApiErrors.forbidden('Only admins can create roles');
        }

        const body = await req.json();
        const validation = createRoleSchema.safeParse(body);

        if (!validation.success) {
            return ApiErrors.badRequest('Invalid role data',
                (validation.error as any).errors.map((e: any) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: 'VALIDATION_ERROR'
                }))
            );
        }

        // Check if role name already exists for this company
        const existingRole = await prisma.role.findFirst({
            where: {
                name: validation.data.name,
                companyId: user.companyId,
            }
        });

        if (existingRole) {
            return ApiErrors.badRequest('Role with this name already exists');
        }

        const role = await prisma.role.create({
            data: {
                ...validation.data,
                companyId: user.companyId,
            }
        });

        return successResponse(role);

    } catch (error) {
        console.error('Error creating role:', error);
        return ApiErrors.internalError();
    }
}