import prisma from '@/lib/prisma';
import { getPresetDateRange } from '@/lib/leave-request-time-range';
import {
    startOfDay,
    endOfDay,
    isAfter,
    addYears,
    getYear,
    isSameDay
} from 'date-fns';
import { DayPart } from '@/lib/generated/prisma/enums';
import { LeaveCalculationService } from './leave-calculation-service';
import { AllowanceService } from './allowance-service';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    allowanceExceeded?: boolean;
    daysRequested?: number;
    resolvedUser?: {
        id: string;
        companyId: string;
        isAdmin: boolean;
        isAutoApprove: boolean;
        activated: boolean;
        deletedAt: Date | null;
        department?: { includePublicHolidays: boolean } | null;
        company: { allowNegativeAllowance: boolean };
    };
    resolvedLeaveType?: {
        id: string;
        name: string;
        autoApprove: boolean;
        useAllowance: boolean;
        limit: number | null;
    };
}

export class LeaveValidationService {
    /**
     * Validates a leave request against all business rules.
     */
    static async validateRequest(
        userId: string,
        leaveTypeId: string,
        dateStart: Date,
        dayPartStart: DayPart,
        dateEnd: Date,
        dayPartEnd: DayPart,
        employeeComment?: string,
        forceCreate?: boolean,
        options?: {
            startTime?: { hours: number; minutes: number };
            endTime?: { hours: number; minutes: number };
        }
    ): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Basic Date Validation
        if (isAfter(startOfDay(dateStart), startOfDay(dateEnd))) {
            errors.push('End date cannot be before start date.');
        }

        const maxFutureDate = addYears(new Date(), 2);
        if (isAfter(startOfDay(dateEnd), startOfDay(maxFutureDate))) {
            errors.push('Requests cannot be made more than 2 years in the future.');
        }

        if (employeeComment && employeeComment.length > 255) {
            errors.push('Comment cannot exceed 255 characters.');
        }

        // Logic check for half-days on same day
        if (isSameDay(dateStart, dateEnd)) {
            if (dayPartStart === DayPart.MORNING && dayPartEnd === DayPart.AFTERNOON) {
                // This is essentially a full day from morning to afternoon? 
                // PRD says: If start_date = end_date and start_day_part = 'morning', only allow 'morning' or 'all'
                // Wait, if it's start=morning and end=afternoon on SAME day, it's just a full day?
                // Actually, "All Day" meant start=ALL, end=ALL.
                // If start=MORNING and end=AFTERNOON on same day, it's a bit ambiguous.
                // Standard behavior should probably be: 
                // start=MORNING, end=MORNING -> 0.5 day (morning)
                // start=AFTERNOON, end=AFTERNOON -> 0.5 day (afternoon)
                // start=ALL, end=ALL -> 1.0 day
            }

            if (dayPartStart === DayPart.AFTERNOON && dayPartEnd === DayPart.MORNING) {
                errors.push('Invalid time selection: Afternoon start cannot end in Morning on the same day.');
            }
        }

        if (errors.length > 0) return { isValid: false, errors, warnings };

        // 2. User and Leave Type Fetching (parallel)
        const [user, leaveType] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                include: { company: true, department: true }
            }),
            prisma.leaveType.findUnique({
                where: { id: leaveTypeId }
            })
        ]);

        if (!user) throw new Error('User not found');
        if (!user.activated || user.deletedAt) {
            errors.push('User account is not active.');
        }

        if (!leaveType) throw new Error('Leave type not found');

        if (errors.length > 0) return { isValid: false, errors, warnings };

        // Fetch user with contract type for overlap detection
        const userWithContractType = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                contractType: { select: { name: true } },
                company: { select: { minutesPerDay: true } }
            }
        });

        // 3. Working Day Validation & Day Calculation
        const requestedRangeContext = await LeaveCalculationService.buildCalculationContext(
            userId,
            dateStart,
            dateEnd,
            user
        );

        const durationMinutes = LeaveCalculationService.calculateDurationMinutesWithContext(
            requestedRangeContext,
            dateStart,
            dayPartStart,
            dateEnd,
            dayPartEnd,
            options?.startTime,
            options?.endTime
        );
        const daysRequested = requestedRangeContext.minutesPerDay > 0
            ? durationMinutes / requestedRangeContext.minutesPerDay
            : 0;

        if (daysRequested <= 0) {
            errors.push('The requested period does not contain any working days.');
            return { isValid: false, errors, warnings, daysRequested: 0 };
        }

        // 4. Overlap Detection
        const overlaps = await this.detectOverlaps(userId, dateStart, dayPartStart, dateEnd, dayPartEnd, 
            userWithContractType?.company?.minutesPerDay, 
            options?.startTime, 
            options?.endTime);
        if (overlaps.length > 0) {
            const statusText = overlaps[0].status === 'approved' ? 'approved' : 'pending';
            errors.push(`You already have a ${statusText} leave request on these dates. Please select different dates.`);
        }

        // 5. Allowance Validation
        let allowanceExceeded = false;
        if (leaveType.useAllowance) {
            const year = getYear(dateStart);
            const breakdown = await AllowanceService.getAllowanceBreakdown(userId, year, { user });

            // Check if request spans years
            if (getYear(dateEnd) !== year) {
                // For simplicity, we currently validate against the start year.
                // TODO: Handle year-spanning requests by splitting validation.
                warnings.push('Request spans multiple years. Validation currently performed against start year only.');
            }

            allowanceExceeded = breakdown.availableAllowance < daysRequested;

            if (allowanceExceeded && !user.isAdmin && !user.isAutoApprove && !forceCreate) {
                // Check if company allows negative allowance
                if (!user.company.allowNegativeAllowance) {
                    errors.push(`Insufficient allowance. Requested: ${daysRequested}, Available: ${breakdown.availableAllowance}`);
                } else {
                    warnings.push(`Insufficient allowance. This will result in a negative balance.`);
                }
            }
        }

        // 6. Leave Type Limit Validation
        if (leaveType.limit !== null && leaveType.limit > 0) {
            const year = getYear(dateStart);
            const usedForType = await this.calculateUsedDaysForType(userId, leaveTypeId, year, user);
            if (usedForType + daysRequested > leaveType.limit) {
                errors.push(`${leaveType.name} limit exceeded. Maximum allowance is ${leaveType.limit} days per year.`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            allowanceExceeded,
            daysRequested,
            resolvedUser: {
                id: user.id,
                companyId: user.companyId,
                isAdmin: user.isAdmin,
                isAutoApprove: user.isAutoApprove,
                activated: user.activated,
                deletedAt: user.deletedAt,
                department: user.department ? { includePublicHolidays: user.department.includePublicHolidays } : null,
                company: { allowNegativeAllowance: user.company.allowNegativeAllowance }
            },
            resolvedLeaveType: {
                id: leaveType.id,
                name: leaveType.name,
                autoApprove: leaveType.autoApprove,
                useAllowance: leaveType.useAllowance,
                limit: leaveType.limit
            }
        };
    }

    /**
     * Detects if proposed leave request overlaps with any existing requests.
     */
    private static async detectOverlaps(
        userId: string,
        dateStart: Date,
        dayPartStart: DayPart,
        dateEnd: Date,
        dayPartEnd: DayPart,
        minutesPerDay?: number | null,
        startTime?: { hours: number; minutes: number } | null,
        endTime?: { hours: number; minutes: number } | null
    ) {
        // Apply the same date transformation used when storing leave requests
        const { persistedDateStart, persistedDateEnd } = getPresetDateRange(
            dateStart,
            dateEnd,
            dayPartStart,
            dayPartEnd,
            minutesPerDay,
            startTime && startTime.hours !== undefined ? startTime : undefined,
            endTime && endTime.hours !== undefined ? endTime : undefined
        );

        // Quick database check for date overlaps first
         const dateOverlaps = await prisma.leaveRequest.findMany({
             where: {
                 userId,
                 status: {
                     in: ['NEW' as any, 'APPROVED' as any, 'PENDING_REVOKE' as any]
                 },
                 AND: [
                     { dateStart: { lt: endOfDay(persistedDateEnd) } },
                     { dateEnd: { gt: startOfDay(persistedDateStart) } }
                 ]
             }
         });

        const overlapConflicts = dateOverlaps.filter((req) => (
            persistedDateStart < req.dateEnd && persistedDateEnd > req.dateStart
        ));

        return overlapConflicts;
    }

    /**
     * Calculates how many days of a specific leave type have been used/requested in a year.
     */
    private static async calculateUsedDaysForType(
        userId: string,
        leaveTypeId: string,
        year: number,
        preloadedUser?: {
            id: string;
            companyId: string;
            department?: { includePublicHolidays: boolean } | null;
        } | null
    ): Promise<number> {
         const leaves = await prisma.leaveRequest.findMany({
             where: {
                 userId,
                 leaveTypeId,
                 status: {
                     in: ['NEW' as any, 'APPROVED' as any, 'PENDING_REVOKE' as any]
                 },
                 dateStart: {
                     gte: new Date(year, 0, 1),
                     lte: new Date(year, 11, 31)
                 }
             }
         });

        if (leaves.length === 0) return 0;

        const minStart = leaves.reduce(
            (min, leave) => leave.dateStart < min ? leave.dateStart : min,
            leaves[0].dateStart
        );
        const maxEnd = leaves.reduce(
            (max, leave) => leave.dateEnd > max ? leave.dateEnd : max,
            leaves[0].dateEnd
        );

        const calculationContext = await LeaveCalculationService.buildCalculationContext(
            userId,
            minStart,
            maxEnd,
            preloadedUser
        );

        return leaves.reduce((total, leave) => (
            total + LeaveCalculationService.calculateLeaveDaysWithContext(
                calculationContext,
                leave.dateStart,
                leave.dayPartStart,
                leave.dateEnd,
                leave.dayPartEnd
            )
        ), 0);
    }
}
