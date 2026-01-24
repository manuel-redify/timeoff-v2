import "dotenv/config";
import prisma from '../lib/prisma';
import { LeaveCalculationService } from '../lib/leave-calculation-service';

async function debugCalculation() {
    console.log('--- Debugging Tony Stark Day Calculation ---');

    try {
        const user = await prisma.user.findFirst({
            where: { OR: [{ name: { contains: 'Tony' } }, { email: { contains: 'stark' } }] },
            include: {
                leaveRequests: {
                    where: { status: 'APPROVED' as any },
                    include: { leaveType: true }
                },
                company: true
            }
        });

        if (!user || user.leaveRequests.length === 0) {
            console.log('Tony Stark or approved requests not found.');
            return;
        }

        const request = user.leaveRequests[0];
        console.log(`Request ID: ${request.id}`);
        console.log(`Dates: ${request.dateStart} to ${request.dateEnd}`);
        console.log(`Day Parts: Start=${request.dayPartStart}, End=${request.dayPartEnd}`);

        const days = await LeaveCalculationService.calculateLeaveDays(
            user.id,
            request.dateStart,
            request.dayPartStart,
            request.dateEnd,
            request.dayPartEnd
        );

        console.log(`Calculated Days: ${days}`);

        // Inspect holiday and schedule for that day
        const date = request.dateStart;
        const isWorking = await (LeaveCalculationService as any).isWorkingDay(user.id, date);
        const isHoliday = await (LeaveCalculationService as any).isPublicHoliday(user.companyId, date, user.country || user.company.country);

        console.log(`Is Working Day: ${isWorking}`);
        console.log(`Is Public Holiday: ${isHoliday}`);

    } catch (error) {
        console.error('Error during debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugCalculation();
