import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("=== DATA SETUP FOR PETER PARKER SCENARIO ===");

    const user = await prisma.user.findFirst({
        where: { name: 'Peter', lastname: 'Parker' },
        include: { company: true, projects: { include: { project: true } } }
    });

    if (!user) {
        console.error("User Peter Parker not found");
        return;
    }

    const companyId = user.companyId;
    const project = user.projects[0]?.project;

    if (!project) {
        console.error("Peter Parker has no project assigned");
        return;
    }

    console.log(`Company: ${user.company.name} (ID: ${companyId})`);
    console.log(`Project: ${project.name} (ID: ${project.id})`);

    // 1. Switch Company to Mode 2
    await prisma.company.update({
        where: { id: companyId },
        data: { mode: 2 }
    });
    console.log("Updated company to Mode 2 (Advanced)");

    // 2. Ensure Roles exist and get IDs
    const techLeadRole = await prisma.role.findFirst({ where: { name: 'Tech Lead', companyId } });
    const pmRole = await prisma.role.findFirst({ where: { name: 'Project Manager', companyId } });
    const devRole = await prisma.role.findFirst({ where: { name: 'Developer', companyId } });

    if (!techLeadRole || !pmRole || !devRole) {
        console.error("Missing roles (Tech Lead, Project Manager, or Developer)");
        return;
    }

    // 3. Set Project Roles for Tony Stark and Steve Rogers
    const tony = await prisma.user.findFirst({ where: { name: 'Tony', lastname: 'Stark' } });
    const steve = await prisma.user.findFirst({ where: { name: 'Steve', lastname: 'Rogers' } });

    if (tony) {
        await prisma.userProject.updateMany({
            where: { userId: tony.id, projectId: project.id },
            data: { roleId: techLeadRole.id }
        });
        console.log(`Set Tony Stark as Tech Lead for project ${project.name}`);
    }

    if (steve) {
        await prisma.userProject.updateMany({
            where: { userId: steve.id, projectId: project.id },
            data: { roleId: pmRole.id }
        });
        console.log(`Set Steve Rogers as Project Manager for project ${project.name}`);
    }

    // 4. Create Approval Rules for Developer role
    // Delete any existing rules for Developer/LEAVE to avoid duplicates if re-run
    await prisma.approvalRule.deleteMany({
        where: {
            companyId,
            subjectRoleId: devRole.id,
            requestType: { in: ['LEAVE', 'LEAVE_REQUEST', 'ANY'] }
        }
    });

    await prisma.approvalRule.create({
        data: {
            companyId,
            requestType: 'LEAVE_REQUEST',
            projectType: project.type,
            subjectRoleId: devRole.id,
            approverRoleId: techLeadRole.id,
            approverAreaConstraint: 'SAME_PROJECT',
            sequenceOrder: 1
        }
    });

    await prisma.approvalRule.create({
        data: {
            companyId,
            requestType: 'LEAVE_REQUEST',
            projectType: project.type,
            subjectRoleId: devRole.id,
            approverRoleId: pmRole.id,
            approverAreaConstraint: 'SAME_PROJECT',
            sequenceOrder: 2
        }
    });

    console.log("Created Approval Rules: Step 1 (Tech Lead) -> Step 2 (Project Manager) with SAME_PROJECT scope.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
