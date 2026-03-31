import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    const roles = await prisma.role.findMany();
    console.log("--- Roles ---");
    roles.forEach(r => console.log(`${r.name}: ${r.id}`));

    const rules = await prisma.approvalRule.findMany({
        include: {
            approverRole: true,
            subjectRole: true
        }
    });

    console.log("\n--- Approval Rules ---");
    rules.forEach(r => {
        console.log(`Rule ID: ${r.id}`);
        console.log(`  Subject: ${r.subjectRole?.name} (${r.subjectRoleId})`);
        console.log(`  Approver: ${r.approverRole?.name} (${r.approverRoleId})`);
        console.log(`  Constraint: ${r.approverAreaConstraint}`);
        console.log(`  Order: ${r.sequenceOrder}`);
        console.log(`  Project Type: ${r.projectType}`);
        console.log(`  Request Type: ${r.requestType}`);
        console.log("---");
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
