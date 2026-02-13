import "dotenv/config";
import prisma from '../lib/prisma';
import { LeaveStatus, DayPart } from '../lib/generated/prisma/enums';

async function main() {
    console.log("Starting verification test (after normalization fix)...");
    try {
        await prisma.$connect();
        const user = await prisma.user.findFirst();
        const leaveType = await prisma.leaveType.findFirst();

        if (!user || !leaveType) {
            console.error("Missing user or leaveType");
            return;
        }

        // Simulating the API route logic: converting to uppercase
        const statusToPass = LeaveStatus.NEW.toUpperCase();
        const dayPartToPass = DayPart.ALL.toUpperCase();

        console.log(`Passing status: "${statusToPass}" (derived from LeaveStatus.NEW: "${LeaveStatus.NEW}")`);
        console.log(`Passing dayPart: "${dayPartToPass}" (derived from DayPart.ALL: "${DayPart.ALL}")`);

        const newRequest = await prisma.leaveRequest.create({
            data: {
                userId: user.id,
                leaveTypeId: leaveType.id,
                dateStart: new Date(),
                dateEnd: new Date(),
                dayPartStart: dayPartToPass as any,
                dayPartEnd: dayPartToPass as any,
                status: statusToPass as any,
                employeeComment: 'Verification test - normalization fixed'
            }
        });

        console.log("SUCCESS: Leave request created with ID:", newRequest.id);

        // Clean up
        await prisma.leaveRequest.delete({ where: { id: newRequest.id } });
        console.log("Cleanup: Deleted test request.");

    } catch (e) {
        console.error("FAILED verification:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
