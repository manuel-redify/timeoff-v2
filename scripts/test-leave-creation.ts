import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("Starting leave request submission test...");
    try {
        await prisma.$connect();
        console.log("Connected!");

        const clerkId = "user_38InvxraVIKlfgfjs5yGPU6nRM9";
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkId },
            include: { company: true }
        });

        if (!user) {
            console.error("User not found!");
            return;
        }

        const leaveType = await prisma.leaveType.findFirst({
            where: { companyId: user.companyId }
        });

        if (!leaveType) {
            console.error("No leave type found for company!");
            return;
        }

        console.log("Attempting to create leave request with status 'NEW'...");
        const newRequest = await prisma.leaveRequest.create({
            data: {
                userId: user.id,
                leaveTypeId: leaveType.id,
                dateStart: new Date(),
                dateEnd: new Date(),
                dayPartStart: 'ALL_DAY' as any,
                dayPartEnd: 'ALL_DAY' as any,
                status: 'NEW' as any,
                employeeComment: 'Verification test'
            }
        });

        console.log("SUCCESS: Leave request created:", newRequest.id);

        // Clean up
        await prisma.leaveRequest.delete({ where: { id: newRequest.id } });
        console.log("Cleanup: Deleted test request.");

    } catch (e) {
        console.error("FAILED to create leave request:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
