import "dotenv/config";
import prisma from './lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function debugQueryLogic() {
    console.log("=== Debugging Query Logic ===");
    
    try {
        await prisma.$connect();

        // Get a test user
        const user = await prisma.user.findFirst({
            where: { activated: true, deletedAt: null },
            include: { company: true }
        });

        if (!user) {
            console.error("No active user found!");
            return;
        }

        // Get a leave type
        const leaveType = await prisma.leaveType.findFirst({
            where: { companyId: user.companyId }
        });

        if (!leaveType) {
            console.error("No leave type found!");
            return;
        }

        // Clean up
        await prisma.leaveRequest.deleteMany({
            where: {
                userId: user.id,
                employeeComment: { contains: "DEBUG_TEST" }
            }
        });

        // Create existing request for Jan 29
        const jan29 = new Date("2026-01-29");
        const existingRequest = await prisma.leaveRequest.create({
            data: {
                userId: user.id,
                leaveTypeId: leaveType.id,
                dateStart: jan29,
                dateEnd: jan29,
                dayPartStart: 'ALL' as any,
                dayPartEnd: 'ALL' as any,
                status: 'APPROVED' as any,
                employeeComment: 'DEBUG_TEST - Jan 29'
            }
        });

        console.log(`Created existing request: Jan 29`);

        // Test the query logic for Jan 30
        const jan30 = new Date("2026-01-30");
        console.log(`\nTesting query for Jan 30:`);
        console.log(`  startOfDay(jan30): ${startOfDay(jan30).toISOString()}`);
        console.log(`  endOfDay(jan30): ${endOfDay(jan30).toISOString()}`);
        console.log(`  existingRequest.dateStart: ${existingRequest.dateStart.toISOString()}`);
        console.log(`  existingRequest.dateEnd: ${existingRequest.dateEnd.toISOString()}`);

        // Test the raw query
        const results = await prisma.leaveRequest.findMany({
            where: {
                userId: user.id,
                status: { in: ['NEW', 'APPROVED', 'PENDING_REVOKE'] as any },
                AND: [
                    { dateStart: { lte: endOfDay(jan30) } },
                    { dateEnd: { gte: startOfDay(jan30) } }
                ]
            }
        });

        console.log(`\nQuery results: Found ${results.length} requests`);
        results.forEach(req => {
            console.log(`  Request: ${req.dateStart.toISOString().split('T')[0]} to ${req.dateEnd.toISOString().split('T')[0]}`);
        });

        // Let's also test the boundary conditions manually
        console.log(`\nManual boundary check:`);
        console.log(`  dateStart <= endOfDay(jan30): ${existingRequest.dateStart <= endOfDay(jan30)}`);
        console.log(`  dateEnd >= startOfDay(jan30): ${existingRequest.dateEnd >= startOfDay(jan30)}`);

        // Test with Jan 28 (should not match)
        const jan28 = new Date("2026-01-28");
        console.log(`\nTesting query for Jan 28:`);
        const resultsJan28 = await prisma.leaveRequest.findMany({
            where: {
                userId: user.id,
                status: { in: ['NEW', 'APPROVED', 'PENDING_REVOKE'] as any },
                AND: [
                    { dateStart: { lte: endOfDay(jan28) } },
                    { dateEnd: { gte: startOfDay(jan28) } }
                ]
            }
        });
        console.log(`Query results for Jan 28: Found ${resultsJan28.length} requests`);

        // Clean up
        await prisma.leaveRequest.delete({
            where: { id: existingRequest.id }
        });

    } catch (error) {
        console.error("Error during debug:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debugQueryLogic();
