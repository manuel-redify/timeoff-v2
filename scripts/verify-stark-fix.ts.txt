import "dotenv/config";
import { AllowanceService } from '../lib/allowance-service';
import prisma from '../lib/prisma';

async function verifyStarkAccuracy() {
    console.log('--- Final Accuracy Verification for Tony Stark ---');

    try {
        const userId = "c0a1413d-ac26-4208-b01f-462458d5dd82"; // Tony Stark ID
        const year = 2026;

        const breakdown = await AllowanceService.getAllowanceBreakdown(userId, year);

        console.log('\n--- Allowance Breakdown (2026) ---');
        console.log(`Base Allowance: ${breakdown.baseAllowance}`);
        console.log(`Used (Approved): ${breakdown.usedAllowance}`);
        console.log(`Pending: ${breakdown.pendingAllowance}`);
        // Tony joined in May 2026, so 8 months = 20 * (8/12) = 13.33 days total.
        // 1 day used = 12.33 available.
        console.log(`Available: ${breakdown.availableAllowance}`);

        if (breakdown.usedAllowance === 1.0) {
            console.log('\n✅ ACCURACY VERIFIED: Used allowance is now correctly 1.0 day!');
        } else {
            console.log(`\n❌ ACCURACY FAILURE: Used allowance is ${breakdown.usedAllowance} (Expected: 1.0)`);
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyStarkAccuracy();
