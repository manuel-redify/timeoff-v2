import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdmin, isSupervisor } from '@/lib/rbac';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { successResponse, ApiErrors } from '@/lib/api-helper';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';

const querySchema = z.object({
    start_date: z.string().transform(val => parseISO(val)),
    end_date: z.string().transform(val => parseISO(val)),
    department_id: z.string().uuid().optional(),
    user_ids: z.string().transform(val => val.split(',')).optional(),
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

        // Parse array parameters manually since they can have multiple values
        const rawParams: Record<string, any> = Object.fromEntries(searchParams);
        rawParams.department_ids = searchParams.getAll('department_ids');
        rawParams.project_ids = searchParams.getAll('project_ids');
        rawParams.role_ids = searchParams.getAll('role_ids');
        rawParams.area_ids = searchParams.getAll('area_ids');

        const query = querySchema.safeParse(rawParams);

        if (!query.success) {
            return ApiErrors.badRequest('Invalid query parameters', query.error.issues.map((e: any) => ({
                field: e.path.join('.'),
                message: e.message
            })));
        }

        const { start_date, end_date, department_id, user_ids, department_ids, project_ids, role_ids, area_ids } = query.data;

        // Permissions check for Wall Chart
        if (user.company.isTeamViewHidden && !user.isAdmin) {
            return ApiErrors.forbidden('Team view is hidden by company policy');
        }

        // Fetch Users to display
        const userWhere: any = {
            companyId: user.companyId,
            deletedAt: null,
            activated: true,
        };

        // Handle single department_id filter
        if (department_id) {
            // Permission check for specific department
            if (!user.isAdmin && user.departmentId !== department_id && !user.company.shareAllAbsences) {
                if (!await isSupervisor(department_id)) {
                    return ApiErrors.forbidden('You do not have permission to view this department');
                }
            }
            userWhere.departmentId = department_id;
        }
        // Handle multiple department_ids filter
        else if (department_ids && department_ids.length > 0) {
            userWhere.departmentId = { in: department_ids };
        }

        // Handle user_ids filter
        if (user_ids && user_ids.length > 0) {
            userWhere.id = { in: user_ids };
        }

        // Handle role_ids filter
        if (role_ids && role_ids.length > 0) {
            userWhere.defaultRoleId = { in: role_ids };
        }

        // Handle area_ids filter
        if (area_ids && area_ids.length > 0) {
            userWhere.areaId = { in: area_ids };
        }

        // Handle project_ids filter - requires special handling with a relation
        if (project_ids && project_ids.length > 0) {
            userWhere.projects = {
                some: {
                    projectId: { in: project_ids }
                }
            };
        }

        // Default to own department if restricted and no specific filters applied
        if (!user.isAdmin && !user.company.shareAllAbsences && !department_id && !(department_ids && department_ids.length > 0) && !user_ids) {
            userWhere.departmentId = user.departmentId;
        }

        const usersWithAbsences = await prisma.user.findMany({
            where: userWhere,
            select: {
                id: true,
                name: true,
                lastname: true,
                country: true,
                department: {
                    select: { name: true }
                },
                leaveRequests: {
                    where: {
                        deletedAt: null,
                        status: { in: ['APPROVED' as any, 'NEW' as any, 'PENDING_REVOKE' as any] },
                        dateEnd: { gte: start_date },
                        dateStart: { lte: end_date },
                    },
                    include: {
                        leaveType: {
                            select: {
                                name: true,
                                color: true,
                            }
                        }
                    }
                }
            },
            orderBy: [
                { name: 'asc' },
                { lastname: 'asc' }
            ]
        });

        // Collect all unique country codes from users + current user's company country as fallback
        const countryCodes = new Set<string>();
        usersWithAbsences.forEach(u => {
            if (u.country) countryCodes.add(u.country);
        });
        countryCodes.add(user.company.country);

        // Fetch Public Holidays for all relevant countries
        const allPublicHolidays = await prisma.bankHoliday.findMany({
            where: {
                companyId: user.companyId,
                country: { in: Array.from(countryCodes) },
                date: {
                    gte: start_date,
                    lte: end_date
                },
                deletedAt: null
            },
            orderBy: { date: 'asc' }
        });

        // Group holidays by country code for easy mapping: Record<countryCode, dateString[]>
        const holidaysMap: Record<string, string[]> = {};
        allPublicHolidays.forEach(h => {
            if (!holidaysMap[h.country]) {
                holidaysMap[h.country] = [];
            }
            holidaysMap[h.country].push(format(h.date, 'yyyy-MM-dd'));
        });

        const response = {
            start_date: format(start_date, 'yyyy-MM-dd'),
            end_date: format(end_date, 'yyyy-MM-dd'),
            users: usersWithAbsences.map((u: any) => ({
                id: u.id,
                name: `${u.name} ${u.lastname}`,
                country_code: u.country || user.company.country,
                department: u.department?.name || 'Unassigned',
                absences: u.leaveRequests.map((abs: any) => ({
                    id: abs.id,
                    start_date: format(new Date(abs.dateStart.getTime() + abs.dateStart.getTimezoneOffset() * 60000), 'yyyy-MM-dd'),
                    end_date: format(new Date(abs.dateEnd.getTime() + abs.dateEnd.getTimezoneOffset() * 60000), 'yyyy-MM-dd'),
                    day_part_start: abs.dayPartStart.toLowerCase(),
                    day_part_end: abs.dayPartEnd.toLowerCase(),
                    leave_type: abs.leaveType.name,
                    color: abs.leaveType.color,
                    status: abs.status.toLowerCase(),
                }))
            })),
            holidays_map: holidaysMap
        };

        return successResponse(response);

    } catch (error) {
        console.error('Error fetching wall chart calendar:', error);
        return ApiErrors.internalError();
    }
}
