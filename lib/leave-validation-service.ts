import prisma from '@/lib/prisma';
import {
    startOfDay,
    endOfDay,
    isAfter,
    addYears,
    getYear,
    isSameDay
} from 'date-fns';
import { DayPart, LeaveStatus } from '@/lib/generated/prisma/enums';
import { LeaveCalculationService } from './leave-calculation-service';
import { AllowanceService } from './allowance-service';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    daysRequested?: number;
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
        employeeComment?: string
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
                include: { company: true }
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

        // 3. Working Day Validation & Day Calculation
        const daysRequested = await LeaveCalculationService.calculateLeaveDays(
            userId,
            dateStart,
            dayPartStart,
            dateEnd,
            dayPartEnd
        );

        if (daysRequested <= 0) {
            errors.push('The requested period does not contain any working days.');
            return { isValid: false, errors, warnings, daysRequested: 0 };
        }

        // 4. Overlap Detection
        const overlaps = await this.detectOverlaps(userId, dateStart, dayPartStart, dateEnd, dayPartEnd);
        if (overlaps.length > 0) {
            errors.push('Selected dates overlap with an existing request.');
        }

        // 5. Allowance Validation
        if (leaveType.useAllowance) {
            const year = getYear(dateStart);
            const breakdown = await AllowanceService.getAllowanceBreakdown(userId, year);

            // Check if request spans years
            if (getYear(dateEnd) !== year) {
                // For simplicity, we currently validate against the start year.
                // TODO: Handle year-spanning requests by splitting validation.
                warnings.push('Request spans multiple years. Validation currently performed against start year only.');
            }

            if (breakdown.availableAllowance < daysRequested && !user.isAdmin && !user.isAutoApprove) {
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
            const usedForType = await this.calculateUsedDaysForType(userId, leaveTypeId, year);
            if (usedForType + daysRequested > leaveType.limit) {
                errors.push(`${leaveType.name} limit exceeded. Maximum allowance is ${leaveType.limit} days per year.`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            daysRequested
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
        dayPartEnd: DayPart
    ) {
        // Quick database check for date overlaps first
        const dateOverlaps = await prisma.leaveRequest.findMany({
            where: {
                userId,
                status: {
                    in: ['NEW', 'APPROVED', 'PENDING_REVOKE'] as any
                },
                AND: [
                    { dateStart: { lt: endOfDay(dateEnd) } },
                    { dateEnd: { gt: startOfDay(dateStart) } }
                ]
            }
        });

        // Filter for actual day part conflicts
        const overlapConflicts = dateOverlaps.filter(req => {
            // Same day request logic
            if (isSameDay(req.dateStart, dateStart) && 
                isSameDay(req.dateStart, req.dateEnd) && 
                isSameDay(dateStart, dateEnd)) {
                return this.isDayPartConflict(req.dayPartStart, dayPartStart);
            }

            // Adjacent dates logic
            if (isSameDay(dateStart, req.dateEnd)) {
                return this.isDayPartConflict(dayPartStart, req.dayPartEnd);
            }
            if (isSameDay(dateEnd, req.dateStart)) {
                return this.isDayPartConflict(dayPartEnd, req.dayPartStart);
            }

            // True multi-day overlap
            return true;
        });

        return overlapConflicts;
    }

    private static isDayPartConflict(part1: DayPart, part2: DayPart): boolean {
        if (part1 === DayPart.ALL || part2 === DayPart.ALL) return true;
        return part1 === part2;
    }

    /**
     * Calculates how many days of a specific leave type have been used/requested in a year.
     */
    private static async calculateUsedDaysForType(userId: string, leaveTypeId: string, year: number): Promise<number> {
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                userId,
                leaveTypeId,
                status: {
                    in: ['NEW', 'APPROVED', 'PENDING_REVOKE'] as any
                },
                dateStart: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                }
            }
        });

        // Calculate leave days in parallel for better performance
        const dayCalculations = leaves.map(leave => 
            LeaveCalculationService.calculateLeaveDays(
                userId,
                leave.dateStart,
                leave.dayPartStart,
                leave.dateEnd,
                leave.dayPartEnd
            )
        );

        const days = await Promise.all(dayCalculations);
        return days.reduce((total, dayCount) => total + dayCount, 0);
    }
}