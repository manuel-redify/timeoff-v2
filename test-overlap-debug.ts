import "dotenv/config";
import prisma from './lib/prisma';
import { LeaveValidationService } from './lib/leave-validation-service';
import { DayPart } from './lib/generated/prisma/enums';

async function testOverlapDetection() {
    console.log("=== Testing Overlap Detection ===");
    
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

        console.log(`Testing with user: ${user.name} ${user.lastname}`);

        // Get a leave type
        const leaveType = await prisma.leaveType.findFirst({
            where: { companyId: user.companyId }
        });

        if (!leaveType) {
            console.error("No leave type found!");
            return;
        }

        console.log(`Using leave type: ${leaveType.name}`);

        // Clean up any existing test requests for this user
        await prisma.leaveRequest.deleteMany({
            where: {
                userId: user.id,
                employeeComment: { contains: "OVERLAP_TEST" }
            }
        });

        // Test Case 1: Create a request for Jan 29, 2026 (ALL day)
        const jan29 = new Date("2026-01-29");
        const request1 = await prisma.leaveRequest.create({
            data: {
                userId: user.id,
                leaveTypeId: leaveType.id,
                dateStart: jan29,
                dateEnd: jan29,
                dayPartStart: 'ALL' as DayPart,
                dayPartEnd: 'ALL' as DayPart,
                status: 'APPROVED' as any,
                employeeComment: 'OVERLAP_TEST - Jan 29'
            }
        });
        console.log(`Created request 1: Jan 29 (ALL day) - ID: ${request1.id}`);

        // Test Case 2: Try to create a request for Jan 30, 2026 (ALL day) - should NOT overlap
        const jan30 = new Date("2026-01-30");
        console.log("\n=== Testing Jan 30 (should NOT overlap) ===");
        
        const validation2 = await LeaveValidationService.validateRequest(
            user.id,
            leaveType.id,
            jan30,
            'ALL' as DayPart,
            jan30,
            'ALL' as DayPart,
            "OVERLAP_TEST - Jan 30"
        );
        
        console.log(`Jan 30 validation result:`);
        console.log(`  Valid: ${validation2.isValid}`);
        console.log(`  Errors: ${validation2.errors.join(', ') || 'None'}`);
        console.log(`  Warnings: ${validation2.warnings.join(', ') || 'None'}`);

        // Test Case 3: Try to create a request for Jan 29, 2026 (MORNING) - should overlap
        console.log("\n=== Testing Jan 29 MORNING (should overlap) ===");
        
        const validation3 = await LeaveValidationService.validateRequest(
            user.id,
            leaveType.id,
            jan29,
            'MORNING' as DayPart,
            jan29,
            'MORNING' as DayPart,
            "OVERLAP_TEST - Jan 29 MORNING"
        );
        
        console.log(`Jan 29 MORNING validation result:`);
        console.log(`  Valid: ${validation3.isValid}`);
        console.log(`  Errors: ${validation3.errors.join(', ') || 'None'}`);

        // Test Case 4: Try to create a request for Jan 29, 2026 (AFTERNOON) - should overlap
        console.log("\n=== Testing Jan 29 AFTERNOON (should overlap) ===");
        
        const validation4 = await LeaveValidationService.validateRequest(
            user.id,
            leaveType.id,
            jan29,
            'AFTERNOON' as DayPart,
            jan29,
            'AFTERNOON' as DayPart,
            "OVERLAP_TEST - Jan 29 AFTERNOON"
        );
        
        console.log(`Jan 29 AFTERNOON validation result:`);
        console.log(`  Valid: ${validation4.isValid}`);
        console.log(`  Errors: ${validation4.errors.join(', ') || 'None'}`);

        // Test Case 5: Try to create a request spanning Jan 29-30 - should overlap
        console.log("\n=== Testing Jan 29-30 span (should overlap) ===");
        
        const validation5 = await LeaveValidationService.validateRequest(
            user.id,
            leaveType.id,
            jan29,
            'ALL' as DayPart,
            jan30,
            'ALL' as DayPart,
            "OVERLAP_TEST - Jan 29-30"
        );
        
        console.log(`Jan 29-30 validation result:`);
        console.log(`  Valid: ${validation5.isValid}`);
        console.log(`  Errors: ${validation5.errors.join(', ') || 'None'}`);

        // Let's also test the raw overlap detection
        console.log("\n=== Raw overlap detection test ===");
        const { detectOverlaps } = LeaveValidationService as any;
        
        const overlapsJan30 = await detectOverlaps(
            user.id,
            jan30,
            'ALL' as DayPart,
            jan30,
            'ALL' as DayPart
        );
        console.log(`Raw overlap detection for Jan 30: Found ${overlapsJan30.length} overlaps`);

        // Clean up test data
        await prisma.leaveRequest.deleteMany({
            where: {
                userId: user.id,
                employeeComment: { contains: "OVERLAP_TEST" }
            }
        });
        console.log("\nCleaned up test requests");

    } catch (error) {
        console.error("Error during test:", error);
    } finally {
        await prisma.$disconnect();
    }
}

testOverlapDetection();
