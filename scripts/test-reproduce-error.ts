import "dotenv/config";
import prisma from '../lib/prisma';
import { LeaveStatus, DayPart } from '../lib/generated/prisma/enums';

async function main() {
    console.log("Starting reproduction test...");
    try {
        await prisma.$connect();
        const user = await prisma.user.findFirst();
        const leaveType = await prisma.leaveType.findFirst();

        if (!user || !leaveType) {
            console.error("Missing user or leaveType");
            return;
        }

        console.log(`Using LeaveStatus.NEW: "${LeaveStatus.NEW}"`);
        console.log(`Using DayPart.ALL: "${DayPart.ALL}"`);

        const newRequest = await prisma.leaveRequest.create({
            data: {
                userId: user.id,
                leaveTypeId: leaveType.id,
                dateStart: new Date("2026-02-16T00:00:00.000Z"),
                dateEnd: new Date("2026-02-16T00:00:00.000Z"),
                dayPartStart: DayPart.ALL,
                dayPartEnd: DayPart.ALL,
                status: LeaveStatus.NEW as any,
                employeeComment: 'Reproduction test',
                approverId: null,
                decidedAt: null
            }
        });

        console.log("SUCCESS: Leave request created:", newRequest.id);
        await prisma.leaveRequest.delete({ where: { id: newRequest.id } });
        console.log("Cleanup complete.");
    } catch (e) {
        console.error("FAILED to create leave request:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
