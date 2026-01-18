import prisma from '@/lib/prisma';
import {
    startOfYear,
    endOfYear,
    getYear,
    getMonth,
    getDate,
    addMonths,
    differenceInMonths,
    isAfter,
    isBefore,
    startOfMonth,
    endOfMonth
} from 'date-fns';
import { LeaveCalculationService } from './leave-calculation-service';
import { LeaveStatus } from '@/lib/generated/prisma/enums';

export interface AllowanceBreakdown {
    userId: string;
    year: number;
    baseAllowance: number;
    proRatedAdjustment: number;
    manualAdjustment: number;
    carriedOver: number;
    totalAllowance: number;
    usedAllowance: number;
    pendingAllowance: number;
    availableAllowance: number;
    allowanceSource: 'department' | 'company';
    isProRated: boolean;
    proRatingReason: string | null;
}

export class AllowanceService {

    /**
     * Gets the full allowance breakdown for a user for a specific year.
     */
    static async getAllowanceBreakdown(userId: string, year: number): Promise<AllowanceBreakdown> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                department: true,
                company: true,
                allowanceAdjustments: {
                    where: { year }
                }
            }
        });

        if (!user) throw new Error('User not found');

        // 1. Get Base Allowance
        let baseAllowance = 20; // Default fallback
        let allowanceSource: 'department' | 'company' = 'company';

        if (user.department && (user.department.allowance as any) !== null) {
            baseAllowance = (user.department.allowance as any).toNumber ? (user.department.allowance as any).toNumber() : Number(user.department.allowance);
            allowanceSource = 'department';
        } else {
            // Use company default
            const rawAllowance = (user.company as any).defaultAllowance;
            baseAllowance = rawAllowance?.toNumber ? rawAllowance.toNumber() : (Number(rawAllowance) || 20);
            allowanceSource = 'company';
        }

        // 2. Pro-rating Calculation
        const proRating = this.calculateProRating(user.startDate, user.endDate || undefined, baseAllowance, year, user.company.startOfNewYear);

        // 3. Manual and Carry-over Adjustments
        const adjustmentRecord = user.allowanceAdjustments[0];
        const manualAdjustment = (adjustmentRecord?.adjustment as any)?.toNumber ? (adjustmentRecord.adjustment as any).toNumber() : (Number(adjustmentRecord?.adjustment) || 0);
        const carriedOver = (adjustmentRecord?.carriedOverAllowance as any)?.toNumber ? (adjustmentRecord.carriedOverAllowance as any).toNumber() : (Number(adjustmentRecord?.carriedOverAllowance) || 0);

        // 4. Consumption (Used and Pending)
        const consumption = await this.calculateConsumption(userId, year);

        const totalAllowance = proRating.proRatedAllowance + manualAdjustment + carriedOver;
        const availableAllowance = totalAllowance - consumption.approved - consumption.pending;

        return {
            userId,
            year,
            baseAllowance,
            proRatedAdjustment: proRating.proRatedAllowance - baseAllowance,
            manualAdjustment,
            carriedOver,
            totalAllowance,
            usedAllowance: consumption.approved,
            pendingAllowance: consumption.pending,
            availableAllowance,
            allowanceSource,
            isProRated: proRating.isProRated,
            proRatingReason: proRating.reason
        };
    }

    /**
     * Calculates pro-rated allowance based on start and end dates.
     */
    private static calculateProRating(
        startDate: Date,
        endDate: Date | undefined,
        baseAllowance: number,
        year: number,
        startOfNewYearMonth: number // 1-12
    ) {
        // Find the start and end of the allowance year
        // For simplicity, we assume allowance year starts on the 1st of the startOfNewYearMonth
        if (baseAllowance === 9999) {
            return { proRatedAllowance: 9999, isProRated: false, reason: null };
        }

        const allowanceYearStart = new Date(year, startOfNewYearMonth - 1, 1);
        const allowanceYearEnd = endOfMonth(addMonths(allowanceYearStart, 11));

        let effectiveStart = startDate;
        let effectiveEnd = endDate || allowanceYearEnd;

        // If hired before year start, use year start
        if (isBefore(startDate, allowanceYearStart)) {
            effectiveStart = allowanceYearStart;
        }

        // If hired after year end, they have 0 allowance for this year
        if (isAfter(startDate, allowanceYearEnd)) {
            return { proRatedAllowance: 0, isProRated: true, reason: 'Started after this allowance year' };
        }

        // If leaver before year start
        if (endDate && isBefore(endDate, allowanceYearStart)) {
            return { proRatedAllowance: 0, isProRated: true, reason: 'Left before this allowance year' };
        }

        // If leaver after year end, use year end
        if (endDate && isAfter(endDate, allowanceYearEnd)) {
            effectiveEnd = allowanceYearEnd;
        }

        // Apply 15th of the month rule
        let includeStartMonth = getDate(effectiveStart) <= 15;
        let startMonthIndex = getMonth(effectiveStart); // 0-11
        let startYear = getYear(effectiveStart);

        let includeEndMonth = endDate ? getDate(effectiveEnd) >= 15 : true;
        let endMonthIndex = getMonth(effectiveEnd);
        let endYear = getYear(effectiveEnd);

        // Calculate months employed in this specific allowance year
        // We count full months based on the 15th rule

        // Months from effectiveStart to allowanceYearEnd
        let months = 0;

        // Iterate through months in the allowance year
        for (let m = 0; m < 12; m++) {
            const currentMonthStart = addMonths(allowanceYearStart, m);
            const currentMonthEnd = endOfMonth(currentMonthStart);

            // Check if user was employed during this month
            // User is considered employed if they were active for enough of the month (15th rule)

            if (isSameMonth(currentMonthStart, effectiveStart)) {
                if (getDate(effectiveStart) <= 15) months++;
            } else if (endDate && isSameMonth(currentMonthStart, effectiveEnd)) {
                if (getDate(effectiveEnd) >= 15) months++;
            } else if (isAfter(currentMonthStart, effectiveStart) && !isAfter(currentMonthEnd, effectiveEnd)) {
                months++;
            }
        }

        const isProRated = months < 12;
        const proRatedAllowance = (baseAllowance * months) / 12;

        let reason = null;
        if (isProRated) {
            if (isAfter(startDate, allowanceYearStart)) {
                reason = `Started ${format(startDate, 'MMM d, yyyy')}`;
            } else if (endDate && isBefore(endDate, allowanceYearEnd)) {
                reason = `Leaving ${format(endDate, 'MMM d, yyyy')}`;
            }
        }

        return {
            proRatedAllowance: Math.round(proRatedAllowance * 100) / 100,
            isProRated,
            reason
        };
    }

    private static async calculateConsumption(userId: string, year: number) {
        // Get all leave requests for this user and year that use allowance
        const leaves = await prisma.leaveRequest.findMany({
            where: {
                userId,
                status: {
                    in: ['NEW' as any, 'APPROVED' as any]
                },
                leaveType: {
                    useAllowance: true
                },
                // Overlaps with the year
                OR: [
                    {
                        dateStart: {
                            gte: new Date(year, 0, 1),
                            lte: new Date(year, 11, 31)
                        }
                    },
                    {
                        dateEnd: {
                            gte: new Date(year, 0, 1),
                            lte: new Date(year, 11, 31)
                        }
                    }
                ]
            },
            include: {
                leaveType: true
            }
        });

        let approved = 0;
        let pending = 0;

        for (const leave of leaves) {
            // We need to calculate how many days of this leave fall into THIS year
            // but for now let's assume leaves don't cross year boundaries frequently 
            // and just calculate the whole leave if it starts in this year.
            // TODO: Handle year boundary spanning requests properly

            const days = await LeaveCalculationService.calculateLeaveDays(
                userId,
                leave.dateStart,
                leave.dayPartStart,
                leave.dateEnd,
                leave.dayPartEnd
            );

            if (leave.status === LeaveStatus.APPROVED) {
                approved += days;
            } else if (leave.status === LeaveStatus.NEW) {
                pending += days;
            }
        }

        return { approved, pending };
    }

    /**
     * Calculates and applies carry-over from the previous year.
     */
    static async applyCarryOver(userId: string, targetYear: number): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true }
        });

        if (!user) throw new Error('User not found');

        const prevYear = targetYear - 1;
        const prevYearBreakdown = await this.getAllowanceBreakdown(userId, prevYear);

        // Unused days from previous year
        const unusedDays = Math.max(0, prevYearBreakdown.totalAllowance - prevYearBreakdown.usedAllowance);

        // Carry-over limit from company settings
        const carryOverLimit = user.company.carryOver;

        // Actual carry-over (min of unused and limit). 1000 = unlimited.
        const actualCarryOver = carryOverLimit === 1000 ? unusedDays : Math.min(unusedDays, carryOverLimit);

        // Apply to target year
        await prisma.userAllowanceAdjustment.upsert({
            where: {
                userId_year: {
                    userId,
                    year: targetYear
                }
            },
            update: {
                carriedOverAllowance: actualCarryOver
            },
            create: {
                userId,
                year: targetYear,
                carriedOverAllowance: actualCarryOver,
                adjustment: 0
            }
        });

        return actualCarryOver;
    }
}

function isSameMonth(d1: Date, d2: Date) {
    return getYear(d1) === getYear(d2) && getMonth(d1) === getMonth(d2);
}

function format(date: Date, str: string) {
    // simplified format for reason string
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[getMonth(date)]} ${getDate(date)}, ${getYear(date)}`;
}
