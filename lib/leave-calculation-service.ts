import prisma from '@/lib/prisma';
import {
    startOfDay,
    endOfDay,
    eachDayOfInterval,
    isSameDay,
    getDay,
    format,
    setHours,
    setMinutes,
    differenceInMinutes
} from 'date-fns';
import { DayPart } from '@/lib/generated/prisma/enums';

export const DEFAULT_WORK_START_HOUR = 9;
export const DEFAULT_WORK_END_HOUR = 18;
export const DEFAULT_MORNING_END_HOUR = 13;
export const DEFAULT_AFTERNOON_START_HOUR = 14;

export interface LeaveCalculationContext {
    userId: string;
    companyId: string;
    includePublicHolidays: boolean;
    minutesPerDay: number;
    schedule: {
        monday: number;
        tuesday: number;
        wednesday: number;
        thursday: number;
        friday: number;
        saturday: number;
        sunday: number;
    };
    holidayDates: Set<string>;
}

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
        const context = await this.buildCalculationContext(userId, startDate, endDate);
        return this.calculateLeaveDaysWithContext(context, startDate, dayPartStart, endDate, dayPartEnd);
    }

    static async buildCalculationContext(
        userId: string,
        startDate: Date,
        endDate: Date,
        preloadedUser?: {
            id: string;
            companyId: string;
            company?: { minutesPerDay: number; } | null;
            department?: { includePublicHolidays: boolean } | null;
        } | null
    ): Promise<LeaveCalculationContext> {
        const user = preloadedUser ?? await prisma.user.findUnique({
            where: { id: userId },
            include: {
                department: true,
                company: true
            }
        });

        if (!user) throw new Error('User not found');

        const schedule = await this.getScheduleForUser(user.id, user.companyId);

        const bankHolidays = await prisma.bankHoliday.findMany({
            where: {
                companyId: user.companyId,
                date: {
                    gte: startOfDay(startDate),
                    lte: endOfDay(endDate)
                }
            }
        });

        return {
            userId: user.id,
            companyId: user.companyId,
            includePublicHolidays: user.department?.includePublicHolidays !== false,
            minutesPerDay: user.company?.minutesPerDay || 480,
            schedule,
            holidayDates: new Set(bankHolidays.map(h => format(h.date, 'yyyy-MM-dd')))
        };
    }

    static calculateLeaveDaysWithContext(
        context: LeaveCalculationContext,
        startDate: Date,
        dayPartStart: DayPart,
        endDate: Date,
        dayPartEnd: DayPart
    ): number {
        let totalDays = 0;
        const interval = eachDayOfInterval({ start: startDate, end: endDate });

        for (const date of interval) {
            const dateStr = format(date, 'yyyy-MM-dd');

            // Check if it's a working day according to schedule
            const scheduleValue = this.getScheduleValueForDate(context.schedule, date);

            // value: 1=working, 2=not working, 3=morning, 4=afternoon
            const isWorkingFull = scheduleValue === 1;
            const isMorningOnly = scheduleValue === 3;
            const isAfternoonOnly = scheduleValue === 4;
            const isNonWorking = scheduleValue === 2;

            if (isNonWorking) continue;

            // Check for bank holidays if department settings require it
            // includePublicHolidays = true means they are "free" (not deducted from allowance)
            if (context.includePublicHolidays) {
                if (context.holidayDates.has(dateStr)) continue;
            }

            // Determine how many days this date contributes
            let dayWeight = 0;
            if (isWorkingFull) dayWeight = 1.0;
            else if (isMorningOnly || isAfternoonOnly) dayWeight = 0.5;

            // Apply day part modifiers for start/end dates
            if (isSameDay(date, startDate) && isSameDay(date, endDate)) {
                // Same day request
                if (dayPartStart === DayPart.ALL) {
                    totalDays += dayWeight;
                } else {
                    // Start/End on same day with half day - always 0.5 according to PRD
                    totalDays += 0.5;
                }
            } else if (isSameDay(date, startDate)) {
                if (dayPartStart === DayPart.ALL) {
                    totalDays += dayWeight;
                } else {
                    // Half day start
                    totalDays += 0.5;
                }
            } else if (isSameDay(date, endDate)) {
                if (dayPartEnd === DayPart.ALL) {
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

    static async calculateDurationMinutes(
        userId: string,
        startDate: Date,
        dayPartStart: DayPart,
        endDate: Date,
        dayPartEnd: DayPart,
        options?: {
            startTime?: { hours: number; minutes: number };
            endTime?: { hours: number; minutes: number };
            preloadedUser?: {
                id: string;
                companyId: string;
                company?: { minutesPerDay: number; } | null;
                department?: { includePublicHolidays: boolean } | null;
            } | null;
        }
    ): Promise<number> {
        const context = await this.buildCalculationContext(
            userId,
            startDate,
            endDate,
            options?.preloadedUser
        );

        return this.calculateDurationMinutesWithContext(
            context,
            startDate,
            dayPartStart,
            endDate,
            dayPartEnd,
            options?.startTime,
            options?.endTime
        );
    }

    static calculateDurationMinutesWithContext(
        context: LeaveCalculationContext,
        startDate: Date,
        dayPartStart: DayPart,
        endDate: Date,
        dayPartEnd: DayPart,
        startTime?: { hours: number; minutes: number },
        endTime?: { hours: number; minutes: number }
    ): number {
        const isSingleDay = isSameDay(startDate, endDate);
        
        if (isSingleDay) {
            if (startTime && endTime) {
                const start = setMinutes(setHours(startDate, startTime.hours), startTime.minutes);
                const end = setMinutes(setHours(startDate, endTime.hours), endTime.minutes);
                return Math.max(0, differenceInMinutes(end, start));
            }
            return this.getMinutesForDayPart(dayPartStart, context.minutesPerDay);
        }

        let totalMinutes = 0;
        const interval = eachDayOfInterval({ start: startDate, end: endDate });

        for (const date of interval) {
            const dateStr = format(date, 'yyyy-MM-dd');
            const scheduleValue = this.getScheduleValueForDate(context.schedule, date);
            
            if (scheduleValue === 2) continue;
            if (context.includePublicHolidays && context.holidayDates.has(dateStr)) continue;

            const isStart = isSameDay(date, startDate);
            const isEnd = isSameDay(date, endDate);

            if (isStart && isEnd) {
                if (startTime && endTime) {
                    const start = setMinutes(setHours(date, startTime.hours), startTime.minutes);
                    const end = setMinutes(setHours(date, endTime.hours), endTime.minutes);
                    totalMinutes += Math.max(0, differenceInMinutes(end, start));
                } else {
                    totalMinutes += this.getMinutesForDayPart(dayPartStart, context.minutesPerDay);
                }
            } else if (isStart) {
                totalMinutes += this.getMinutesForDayPart(dayPartStart, context.minutesPerDay);
            } else if (isEnd) {
                totalMinutes += this.getMinutesForDayPart(dayPartEnd, context.minutesPerDay);
            } else {
                totalMinutes += this.getFullDayMinutes(context.schedule, date, context.minutesPerDay);
            }
        }

        return totalMinutes;
    }

    private static getMinutesForDayPart(dayPart: DayPart, minutesPerDay: number): number {
        switch (dayPart) {
            case DayPart.ALL:
                return minutesPerDay;
            case DayPart.MORNING:
                return (minutesPerDay / 2);
            case DayPart.AFTERNOON:
                return (minutesPerDay / 2);
            default:
                return minutesPerDay;
        }
    }

    private static getFullDayMinutes(schedule: any, date: Date, defaultMinutes: number): number {
        const scheduleValue = this.getScheduleValueForDate(schedule, date);
        
        if (scheduleValue === 1) return defaultMinutes;
        if (scheduleValue === 3 || scheduleValue === 4) return defaultMinutes / 2;
        
        return 0;
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
