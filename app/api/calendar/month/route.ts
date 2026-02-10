import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, isAdmin, isSupervisor } from '@/lib/rbac';
import { LeaveStatus } from '@/lib/generated/prisma/enums';
import { successResponse, ApiErrors } from '@/lib/api-helper';
import { z } from 'zod';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';

const querySchema = z.object({
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    department_id: z.string().uuid().optional(),
    user_id: z.string().uuid().optional(),
    leave_type_id: z.string().uuid().optional(),
    view: z.enum(['personal', 'team', 'company']).default('personal'),
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
            return ApiErrors.badRequest('Invalid query parameters', query.error.issues.map(e => ({
                field: e.path.join('.'),
                message: e.message
            })));
        }

        const { year, month, department_id, user_id, leave_type_id, view, department_ids, project_ids, role_ids, area_ids } = query.data;

        // Date range
        const startDate = startOfMonth(new Date(year, month - 1));
        const endDate = endOfMonth(startDate);

        // Permission Logic
        const where: any = {
            deletedAt: null,
            status: { in: ['APPROVED', 'NEW', 'PENDING_REVOKE'] as any },
            dateEnd: { gte: startDate },
            dateStart: { lte: endDate },
            user: {
                companyId: user.companyId,
                deletedAt: null,
            }
        };

        // Filter by View/Permissions
        if (view === 'personal') {
            where.userId = user.id;
        } else if (view === 'team') {
            if (user.isAdmin) {
                // Admin can see any team
                if (department_id) {
                    where.user.departmentId = department_id;
                } else if (department_ids && department_ids.length > 0) {
                    where.user.departmentId = { in: department_ids };
                } else if (user_id) {
                    where.userId = user_id;
                }
            } else {
                // Non-admin: depends on company settings or supervisor status
                const company = user.company;

                if (company.isTeamViewHidden) {
                    return ApiErrors.forbidden('Team view is hidden by company policy');
                }

                if (department_id) {
                    // Check if user is in this department or is a supervisor/boss
                    const isSuper = await isSupervisor(department_id);
                    const isInDept = user.departmentId === department_id;

                    if (!isSuper && !isInDept && !company.shareAllAbsences) {
                        return ApiErrors.forbidden('You do not have permission to view this department');
                    }
                    where.user.departmentId = department_id;
                } else if (department_ids && department_ids.length > 0) {
                    // Check permissions for multiple departments
                    const isSuper = await isSupervisor(department_ids[0]); // Check first dept as sample
                    if (!isSuper && !company.shareAllAbsences) {
                        // Filter to only departments user belongs to
                        where.user.departmentId = { in: department_ids.filter(id => id === user.departmentId) };
                    } else {
                        where.user.departmentId = { in: department_ids };
                    }
                } else if (user_id) {
                    // Check if viewing self or subordinate
                    if (user_id !== user.id && !await isAdmin()) {
                        // More complex check for supervisor would go here
                        // For now basic check
                        if (!company.shareAllAbsences) {
                            return ApiErrors.forbidden('You do not have permission to view other users');
                        }
                    }
                    where.userId = user_id;
                } else {
                    // Default to user's own department if no specific filter
                    where.user.departmentId = user.departmentId;
                }
            }
        } else if (view === 'company') {
            if (!user.isAdmin && !user.company.shareAllAbsences) {
                return ApiErrors.forbidden('You do not have permission to view company-wide absences');
            }
            if (department_id) {
                where.user.departmentId = department_id;
            } else if (department_ids && department_ids.length > 0) {
                where.user.departmentId = { in: department_ids };
            }
            if (user_id) where.userId = user_id;
        }
        
        // Apply array filters
        if (role_ids && role_ids.length > 0) {
            where.user.defaultRoleId = { in: role_ids };
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

        if (leave_type_id) {
            where.leaveTypeId = leave_type_id;
        }

        // Fetch Absences
        const absences = await prisma.leaveRequest.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        lastname: true,
                        id: true,
                        country: true,
                    }
                },
                leaveType: {
                    select: {
                        name: true,
                        color: true,
                    }
                }
            },
            orderBy: [
                { dateStart: 'asc' },
                { user: { lastname: 'asc' } }
            ]
        });

        // Collect all unique country codes from users + current user's company country
        const countryCodes = new Set<string>();
        absences.forEach(abs => {
            if (abs.user.country) countryCodes.add(abs.user.country);
        });
        countryCodes.add(user.country || user.company.country);

        // Fetch Public Holidays for all involved countries
        const allPublicHolidays = await prisma.bankHoliday.findMany({
            where: {
                companyId: user.companyId,
                country: { in: Array.from(countryCodes) },
                date: {
                    gte: startDate,
                    lte: endDate
                },
                deletedAt: null
            },
            orderBy: { date: 'asc' }
        });

        // Group holidays by country code: Record<countryCode, dateString[]>
        const holidaysMap: Record<string, string[]> = {};
        allPublicHolidays.forEach(h => {
            if (!holidaysMap[h.country]) holidaysMap[h.country] = [];
            holidaysMap[h.country].push(format(h.date, 'yyyy-MM-dd'));
        });

        // Generate dates array for the month
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const dates = days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayAbsences = absences.filter(abs => {
                const s = abs.dateStart;
                const e = abs.dateEnd;
                return day >= s && day <= e;
            });

            // For the month view, we flag which countries have a holiday today
            const holidayCountries = allPublicHolidays
                .filter(h => isSameDay(h.date, day))
                .map(h => h.country);

            return {
                date: dayStr,
                holiday_countries: holidayCountries,
                absences: dayAbsences.map((abs: any) => ({
                    id: abs.id,
                    user_id: abs.user.id,
                    user_name: `${abs.user.name} ${abs.user.lastname}`,
                    user_country: abs.user.country || user.company.country,
                    leave_type: abs.leaveType.name,
                    color: abs.leaveType.color,
                    status: abs.status.toLowerCase(),
                    day_part: 'all',
                    is_multi_day: !isSameDay(abs.dateStart, abs.dateEnd),
                    start_date: format(new Date(abs.dateStart.getTime() + abs.dateStart.getTimezoneOffset() * 60000), 'yyyy-MM-dd'),
                    end_date: format(new Date(abs.dateEnd.getTime() + abs.dateEnd.getTimezoneOffset() * 60000), 'yyyy-MM-dd'),
                }))
            };
        });

        return successResponse({
            year,
            month,
            view,
            dates,
            holidays_map: holidaysMap,
        });

    } catch (error) {
        console.error('Error fetching month calendar:', error);
        return ApiErrors.internalError();
    }
}
