import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("--- Checking Company and Rules ---");
    const user = await prisma.user.findFirst({
        where: { name: { contains: 'Peter' } },
        include: { company: true }
    });
    console.log('User:', user?.name, user?.lastname);
    console.log('Company Mode:', user?.company?.mode);

    const rulesCount = await prisma.approvalRule.count();
    console.log('Total Approval Rules:', rulesCount);

    if (rulesCount > 0) {
        const rules = await prisma.approvalRule.findMany({
            include: { approverRole: true, subjectRole: true }
        });
        console.log('Rules sample:', JSON.stringify(rules.slice(0, 2), null, 2));
    }

    const legacyRulesCount = await prisma.approvalRule.count(); // Wait, it's the same table

    // Check if there are any "Legacy" records in some other way? 
    // In many projects there might be a "LeaveRequest" routing field.
}

main().catch(console.error).finally(() => prisma.$disconnect());
