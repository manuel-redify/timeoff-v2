
import { LeaveCalculationService, LeaveCalculationContext } from '../lib/leave-calculation-service';
import { DayPart } from '../lib/generated/prisma/enums';
import { isSameDay, format, setMinutes, setHours, differenceInMinutes, eachDayOfInterval, getDay } from 'date-fns';

async function main() {
    const context: LeaveCalculationContext = {
        schedule: {
            monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 2, sunday: 2
        },
        minutesPerDay: 480, // 8 hours
        includePublicHolidays: false,
        holidayDates: new Set()
    };

    const startDate = new Date('2026-02-23T00:00:00.000Z'); // Monday
    const endDate = new Date('2026-02-23T00:00:00.000Z');
    const dayPartStart = "all" as any; // simulate Prisma returning "all" (not strictly enum "ALL")
    const dayPartEnd = "all" as any;

    console.log("Input DayPart:", dayPartStart, "Enum DayPart.ALL:", DayPart.ALL);
    console.log("Strict equality:", dayPartStart === DayPart.ALL);

    const days = LeaveCalculationService.calculateLeaveDaysWithContext(
        context,
        startDate,
        dayPartStart,
        endDate,
        dayPartEnd
    );

    console.log({ calculatedDays: days });

    // And test duration calculation since that is used for saving
    const minutes = LeaveCalculationService.calculateDurationMinutesWithContext(
        context,
        startDate,
        dayPartStart,
        endDate,
        dayPartEnd
    );
    console.log({ calculatedMinutes: minutes });
}

main().catch(console.error);
