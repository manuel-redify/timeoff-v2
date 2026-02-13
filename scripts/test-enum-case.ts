import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("Starting case-sensitivity reproduction test...");
    try {
        await prisma.$connect();
        const user = await prisma.user.findFirst();
        const leaveType = await prisma.leaveType.findFirst();

        if (!user || !leaveType) {
            console.error("Missing user or leaveType");
            return;
        }

        console.log("Attempting with status: 'NEW' and dayPart: 'ALL'...");
        try {
            const req1 = await prisma.leaveRequest.create({
                data: {
                    userId: user.id,
                    leaveTypeId: leaveType.id,
                    dateStart: new Date(),
                    dateEnd: new Date(),
                    dayPartStart: 'ALL' as any,
                    dayPartEnd: 'ALL' as any,
                    status: 'NEW' as any,
                    employeeComment: 'Case test - UPPER'
                }
            });
            console.log("SUCCESS with UPPERCASE: " + req1.id);
            await prisma.leaveRequest.delete({ where: { id: req1.id } });
        } catch (e) {
            console.error("FAILED with UPPERCASE:", e.message);
        }

        console.log("Attempting with status: 'new' and dayPart: 'all'...");
        try {
            const req2 = await prisma.leaveRequest.create({
                data: {
                    userId: user.id,
                    leaveTypeId: leaveType.id,
                    dateStart: new Date(),
                    dateEnd: new Date(),
                    dayPartStart: 'all' as any,
                    dayPartEnd: 'all' as any,
                    status: 'new' as any,
                    employeeComment: 'Case test - LOWER'
                }
            });
            console.log("SUCCESS with LOWERCASE: " + req2.id);
            await prisma.leaveRequest.delete({ where: { id: req2.id } });
        } catch (e) {
            console.error("FAILED with LOWERCASE:", e.message);
        }

    } catch (e) {
        console.error("GENERAL FAILURE:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
