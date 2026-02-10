import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdmin, isSupervisor } from '@/lib/rbac';
import { successResponse, ApiErrors } from '@/lib/api-helper';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { LeaveStatus } from '../../../../lib/generated/prisma/client';

const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort_by: z.string().default('createdAt'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    department_id: z.string().uuid().optional(),
    leave_type_id: z.string().uuid().optional(),
    status: z.string().optional(), // Comma-separated LeaveStatus
    user_id: z.string().uuid().optional(),
    search: z.string().optional(),
    department_ids: z.array(z.string().uuid()).optional(),
    project_ids: z.array(z.string().uuid()).optional(),
    role_ids: z.array(z.string().uuid()).optional(),
    area_ids: z.array(z.string().uuid()).optional(),
});

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return ApiErrors.unauthorized();

        const { searchParams } = new URL(req.url);
        const queryParams: Record<string, any> = Object.fromEntries(searchParams);
        
        // Parse array parameters manually since they can have multiple values
        queryParams.department_ids = searchParams.getAll('department_ids');
        queryParams.project_ids = searchParams.getAll('project_ids');
        queryParams.role_ids = searchParams.getAll('role_ids');
        queryParams.area_ids = searchParams.getAll('area_ids');
        
        const query = querySchema.safeParse(queryParams);

        if (!query.success) {
            return ApiErrors.badRequest('Invalid query parameters', query.error.issues.map((e: any) => ({
                field: e.path.join('.'),
                message: e.message
            })));
        }

        const { page, limit, sort_by, sort_order, start_date, end_date, department_id, leave_type_id, status, user_id, search, department_ids, project_ids, role_ids, area_ids } = query.data;

        // Build Where Clause
        const where: any = {
            deletedAt: null,
            user: {
                companyId: user.companyId,
                deletedAt: null,
            }
        };

        // Permissions & Filtering
        if (!user.isAdmin) {
            // Check if user is a supervisor for any department
            // If they are not admin or supervisor, they can only see their own requests
            // UNLESS company wide sharing is enabled, but List view is usually more private.
            // Following PRD: Employees see "Own" in many places.

            if (user_id) {
                if (user_id !== user.id) {
                    const canSee = user.company.shareAllAbsences || await isSupervisorOfUser(user.id, user_id);
                    if (!canSee) return ApiErrors.forbidden('You do not have permission to view this user');
                    where.userId = user_id;
                } else {
                    where.userId = user.id;
                }
            } else if (department_id) {
                const isSuper = await isSupervisor(department_id);
                if (!isSuper && (user.departmentId !== department_id || !user.company.shareAllAbsences)) {
                    return ApiErrors.forbidden('You do not have permission to view this department');
                }
                where.user.departmentId = department_id;
            } else if (department_ids && department_ids.length > 0) {
                const isSuper = await isSupervisor(department_ids[0]);
                if (!isSuper && !user.company.shareAllAbsences) {
                    // Filter to only departments user belongs to
                    where.user.departmentId = { in: department_ids.filter(id => id === user.departmentId) };
                } else {
                    where.user.departmentId = { in: department_ids };
                }
            } else {
                // If no specific filter, and not admin/supervisor of anything, show own
                const isAnySuper = await prisma.departmentSupervisor.findFirst({ where: { userId: user.id } });
                const isBoss = await prisma.department.findFirst({ where: { bossId: user.id } });

                if (!isAnySuper && !isBoss && !user.company.shareAllAbsences) {
                    where.userId = user.id;
                }
            }
        } else {
            // Admin can filter by anything
            if (user_id) where.userId = user_id;
            if (department_id) {
                where.user.departmentId = department_id;
            } else if (department_ids && department_ids.length > 0) {
                where.user.departmentId = { in: department_ids };
            }
        }
        
        // Apply array filters
        if (role_ids && role_ids.length > 0) {
            where.user.roleId = { in: role_ids };
        }
        
        if (area_ids && area_ids.length > 0) {
            where.user.areaId = { in: area_ids };
        }
        
        if (project_ids && project_ids.length > 0) {
            where.user.projects = {
                some: {
                    projectId: { in: project_ids }
                }
            };
        }

        // Additional Filters
        if (start_date) where.dateEnd = { gte: parseISO(start_date) };
        if (end_date) where.dateStart = { lte: parseISO(end_date) };
        if (leave_type_id) where.leaveTypeId = leave_type_id;

        if (status) {
            const statuses = status.split(',').map(s => s.trim().toUpperCase());
            where.status = { in: statuses as any };
        }

        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { lastname: { contains: search, mode: 'insensitive' } } },
            ];
        }

        // Count Total
        const total = await prisma.leaveRequest.count({ where });

        // Fetch Data
        const requests = await prisma.leaveRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                        department: { select: { name: true } }
                    }
                },
                leaveType: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                    }
                },
                approver: {
                    select: {
                        id: true,
                        name: true,
                        lastname: true,
                    }
                }
            },
            orderBy: { [sort_by]: sort_order },
            skip: (page - 1) * limit,
            take: limit,
        });

        const response = {
            total,
            page,
            limit,
            requests: requests.map(r => ({
                id: r.id,
                user: {
                    id: r.user.id,
                    name: `${r.user.name} ${r.user.lastname}`,
                    department: r.user.department?.name || 'Unassigned'
                },
                leave_type: r.leaveType,
                date_start: format(r.dateStart, 'yyyy-MM-dd'),
                date_end: format(r.dateEnd, 'yyyy-MM-dd'),
                day_part_start: r.dayPartStart.toLowerCase(),
                day_part_end: r.dayPartEnd.toLowerCase(),
                status: r.status.toLowerCase(),
                approver: r.approver ? `${r.approver.name} ${r.approver.lastname}` : null,
                decided_at: r.decidedAt ? r.decidedAt.toISOString() : null,
                created_at: r.createdAt.toISOString(),
            }))
        };

        return successResponse(response);

    } catch (error) {
        console.error('Error fetching list calendar:', error);
        return ApiErrors.internalError();
    }
}

async function isSupervisorOfUser(supervisorId: string, targetUserId: string) {
    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { departmentId: true }
    });
    if (!targetUser || !targetUser.departmentId) return false;

    // Check if boss
    const isBoss = await prisma.department.findFirst({
        where: { id: targetUser.departmentId, bossId: supervisorId }
    });
    if (isBoss) return true;

    // Check if secondary supervisor
    const isSecondary = await prisma.departmentSupervisor.findFirst({
        where: { departmentId: targetUser.departmentId, userId: supervisorId }
    });

    return !!isSecondary;
}
