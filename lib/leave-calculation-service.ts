import prisma from '@/lib/prisma';
import {
    startOfDay,
    endOfDay,
    eachDayOfInterval,
    isSameDay,
    getDay,
    isAfter,
    isBefore,
    addMonths,
    startOfMonth,
    endOfMonth,
    differenceInMonths,
    format
} from 'date-fns';
import { DayPart } from '@/lib/generated/prisma/enums';

export class LeaveCalculationService {

    /**
     * Calculates the number of working days in a date range for a given user.
     * Accounts for user/company schedule and public holidays.
     */
    static async calculateLeaveDays(
        userId: string,
        startDate: Date,
        dayPartStart: DayPart,
        endDate: Date,
        dayPartEnd: DayPart
    ): Promise<number> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                department: true,
                company: true
            }
        });

        if (!user) throw new Error('User not found');

        // 1. Get user's schedule (or company default)
        const schedule = await this.getScheduleForUser(user.id, user.companyId);

        // 2. Get bank holidays for the company
        const bankHolidays = await prisma.bankHoliday.findMany({
            where: {
                companyId: user.companyId,
                date: {
                    gte: startOfDay(startDate),
                    lte: endOfDay(endDate)
                }
            }
        });

        const holidayDates = bankHolidays.map(h => format(h.date, 'yyyy-MM-dd'));

        // 3. Calculate days
        let totalDays = 0;
        const interval = eachDayOfInterval({ start: startDate, end: endDate });

        for (const date of interval) {
            const dateStr = format(date, 'yyyy-MM-dd');

            // Check if it's a working day according to schedule
            const scheduleValue = this.getScheduleValueForDate(schedule, date);

            // value: 1=working, 2=not working, 3=morning, 4=afternoon
            const isWorkingFull = scheduleValue === 1;
            const isMorningOnly = scheduleValue === 3;
            const isAfternoonOnly = scheduleValue === 4;
            const isNonWorking = scheduleValue === 2;

            if (isNonWorking) continue;

            // Check for bank holidays if department settings require it
            // includePublicHolidays = true means they are "free" (not deducted from allowance)
            if (user.department?.includePublicHolidays !== false) {
                if (holidayDates.includes(dateStr)) continue;
            }

            // Determine how many days this date contributes
            let dayWeight = 0;
            if (isWorkingFull) dayWeight = 1.0;
            else if (isMorningOnly || isAfternoonOnly) dayWeight = 0.5;

            // Apply day part modifiers for start/end dates
            if (isSameDay(date, startDate) && isSameDay(date, endDate)) {
                // Same day request
                if (dayPartStart === 'ALL' as any) {
                    totalDays += dayWeight;
                } else {
                    // Start/End on same day with half day - always 0.5 according to PRD
                    totalDays += 0.5;
                }
            } else if (isSameDay(date, startDate)) {
                if (dayPartStart === 'ALL' as any) {
                    totalDays += dayWeight;
                } else {
                    // Half day start
                    totalDays += 0.5;
                }
            } else if (isSameDay(date, endDate)) {
                if (dayPartEnd === 'ALL' as any) {
                    totalDays += dayWeight;
                } else {
                    // Half day end
                    totalDays += 0.5;
                }
            } else {
                totalDays += dayWeight;
            }
        }

        return totalDays;
    }

    private static async getScheduleForUser(userId: string, companyId: string) {
        // Try user schedule first
        const userSchedule = await prisma.schedule.findFirst({
            where: { userId }
        });

        if (userSchedule) return userSchedule;

        // Fallback to company schedule
        const companySchedule = await prisma.schedule.findFirst({
            where: { companyId, userId: null }
        });

        if (companySchedule) return companySchedule;

        // Default if none found (should not happen with proper initialization)
        return {
            monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1,
            saturday: 2, sunday: 2
        };
    }

    private static getScheduleValueForDate(schedule: any, date: Date): number {
        const dayOfWeek = getDay(date); // 0=Sunday, 1=Monday...
        switch (dayOfWeek) {
            case 0: return schedule.sunday;
            case 1: return schedule.monday;
            case 2: return schedule.tuesday;
            case 3: return schedule.wednesday;
            case 4: return schedule.thursday;
            case 5: return schedule.friday;
            case 6: return schedule.saturday;
            default: return 2;
        }
    }
}
