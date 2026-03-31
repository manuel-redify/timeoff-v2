import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("=== DEBUG DATA DUMP ===");

    const users = await prisma.user.findMany({
        where: { activated: true },
        include: {
            projects: { include: { role: true, project: true } },
            defaultRole: true,
            department: { include: { boss: true, supervisors: { include: { user: true } } } }
        }
    });

    console.log("\n--- Users and Roles ---");
    users.forEach(u => {
        console.log(`${u.name} ${u.lastname} (${u.email})`);
        console.log(`  Default Role: ${u.defaultRole?.name}`);
        console.log(`  Department: ${u.department?.name}`);
        u.projects.forEach(up => {
            console.log(`  Project: ${up.project.name} | Role: ${up.role?.name}`);
        });
    });

    const rules = await prisma.approvalRule.findMany({
        include: { approverRole: true, subjectRole: true }
    });

    console.log("\n--- Approval Rules ---");
    if (rules.length === 0) {
        console.log("No approval rules found!");
    } else {
        rules.forEach(r => {
            console.log(`- If Subject is [${r.subjectRole?.name}] in [${r.projectType}] project`);
            console.log(`  Then [Step ${r.sequenceOrder}] Approver is [${r.approverRole?.name}] (Scope: ${r.approverAreaConstraint})`);
            console.log(`  Type: ${r.requestType}`);
        });
    }

    const companies = await prisma.company.findMany();
    console.log("\n--- Companies ---");
    companies.forEach(c => {
        console.log(`${c.name}: Mode ${c.mode}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
