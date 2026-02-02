import { AllowanceService } from '../lib/allowance-service';
import prisma from '../lib/prisma';

async function main() {
    console.log('--- Testing Allowance Service ---');

    // Get first user
    const user = await prisma.user.findFirst({
        include: { company: true, department: true }
    });

    if (!user) {
        console.log('No user found to test.');
        return;
    }

    console.log(`Testing for user: ${user.name} ${user.lastname} (ID: ${user.id})`);
    console.log(`Company: ${user.company.name}`);
    console.log(`Department: ${user.department?.name}`);
    console.log(`Start Date: ${user.startDate}`);

    const year = 2026;
    try {
        const breakdown = await AllowanceService.getAllowanceBreakdown(user.id, year);
        console.log('\nBreakdown for', year);
        console.log(JSON.stringify(breakdown, null, 2));

        // Test carry-over (will set carry-over for 2027 based on 2026)
        console.log('\nApplying carry-over to 2027...');
        const appliedCarryOver = await AllowanceService.applyCarryOver(user.id, 2027);
        console.log(`Applied carry-over: ${appliedCarryOver}`);

        const breakdown2027 = await AllowanceService.getAllowanceBreakdown(user.id, 2027);
        console.log('\nBreakdown for 2027:');
        console.log(JSON.stringify(breakdown2027, null, 2));

        // Test mid-year joiner (simulation with temp user)
        console.log('\n--- Simulation: Joined July 1, 2026 ---');
        const tempUser0 = await prisma.user.create({
            data: {
                email: 'temp0@test.com',
                name: 'Temp',
                lastname: 'User',
                companyId: user.companyId,
                startDate: new Date('2026-07-01'), // UTC
            }
        });

        const tempBreakdown0 = await AllowanceService.getAllowanceBreakdown(tempUser0.id, 2026);
        console.log('July 1 Joiner (should get 6 months = 10 days):');
        console.log(`Total Allowance: ${tempBreakdown0.totalAllowance} Reason: ${tempBreakdown0.proRatingReason}`);
        await prisma.user.delete({ where: { id: tempUser0.id } });

        console.log('\n--- Simulation: Joined July 15, 2026 ---');
        const tempUser = await prisma.user.create({
            data: {
                email: 'temp@test.com',
                name: 'Temp',
                lastname: 'User',
                companyId: user.companyId,
                startDate: new Date('2026-07-15'), // UTC
            }
        });

        const tempBreakdown = await AllowanceService.getAllowanceBreakdown(tempUser.id, 2026);
        console.log('July 15 Joiner (should get 6 months = 10 days):');
        console.log(`Total Allowance: ${tempBreakdown.totalAllowance} Reason: ${tempBreakdown.proRatingReason}`);
        await prisma.user.delete({ where: { id: tempUser.id } });

        console.log('\n--- Simulation: Joined July 16, 2026 ---');
        const tempUser2 = await prisma.user.create({
            data: {
                email: 'temp2@test.com',
                name: 'Temp2',
                lastname: 'User2',
                companyId: user.companyId,
                startDate: new Date('2026-07-16'), // UTC
            }
        });

        const tempBreakdown2 = await AllowanceService.getAllowanceBreakdown(tempUser2.id, 2026);
        console.log('July 16 Joiner (should get 5 months = 8.33 days):');
        console.log(`Total Allowance: ${tempBreakdown2.totalAllowance} Reason: ${tempBreakdown2.proRatingReason}`);
        await prisma.user.delete({ where: { id: tempUser2.id } });

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
