import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("=== CURRENT SYSTEM STATUS ===");

    const user = await prisma.user.findFirst({
        where: { name: 'Peter' },
        include: { company: true, projects: { include: { role: true, project: true } } }
    });

    if (!user) {
        console.error("Peter Parker not found");
        return;
    }

    console.log(`User: ${user.name} ${user.lastname}`);
    console.log(`Company Mode: ${user.company.mode}`);

    const rules = await prisma.approvalRule.findMany({
        where: { companyId: user.companyId },
        include: { approverRole: true, subjectRole: true }
    });

    console.log(`Approval Rules Found: ${rules.length}`);
    rules.forEach(r => {
        console.log(`- Rule: Subject [${r.subjectRole?.name}] -> Approver [${r.approverRole?.name}] (Seq: ${r.sequenceOrder}, Scope: ${r.approverAreaConstraint})`);
    });

    const userProjects = await prisma.userProject.findMany({
        where: { projectId: { in: user.projects.map(p => p.projectId) } },
        include: { user: true, role: true, project: true }
    });

    console.log("\n--- Project Assignments ---");
    userProjects.forEach(up => {
        console.log(`Project: ${up.project.name} | User: ${up.user.name} | Role: ${up.role?.name}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
