import "dotenv/config";
import prisma from '../lib/prisma.ts';

async function main() {
    const requesterId = 'f0b9225a-fa3a-44b7-bf9f-32ab1399b74e';
    const p1Id = '46d97001-4fe8-4079-97d1-4a979061bf71';
    const p2Id = '4abd0a30-0f80-4a8c-8ab6-45b48a9904ce';

    console.log("--- Inspecting Requester ---");
    const requester = await prisma.user.findUnique({
        where: { id: requesterId },
        include: {
            projects: {
                include: { project: true, role: true }
            },
            defaultRole: true,
            department: true,
            area: true
        }
    });

    if (!requester) {
        console.log("Requester not found!");
    } else {
        console.log(`Requester: ${requester.name} ${requester.lastname} (ID: ${requester.id})`);
        console.log(`Department: ${requester.department?.name} (ID: ${requester.departmentId})`);
        console.log("Projects:");
        for (const up of requester.projects) {
            console.log(`- Project: ${up.project.name} (${up.project.id}) Role: ${up.role?.name} (${up.roleId})`);
        }
    }

    console.log("\n--- Checking Projects ---");
    const p1 = await prisma.project.findUnique({ where: { id: p1Id } });
    const p2 = await prisma.project.findUnique({ where: { id: p2Id } });

    console.log(`Project 1: ${p1?.name} (${p1?.type})`);
    console.log(`Project 2: ${p2?.name} (${p2?.type})`);

    console.log("\n--- Checking Roles/Users ---");
    const users = await prisma.user.findMany({
        where: {
            id: {
                in: [
                    '993fdd49-57e9-4314-992e-7c047cd3f903',
                    '72ebf7ee-3885-414c-913b-dfe0dd1d4773',
                    '051fffc3-e80c-4128-9616-4f9bd70aa4d4',
                    '98f75263-d148-4cd9-85d0-cb6dd36b4cf3'
                ]
            }
        },
        include: { projects: { include: { role: true, project: true } } }
    });

    for (const u of users) {
        console.log(`User: ${u.name} ${u.lastname} (ID: ${u.id})`);
        for (const up of u.projects) {
            console.log(`  - Assigned to ${up.project.name} as ${up.role?.name}`);
        }
    }

    console.log("\n--- Checking Approval Rules ---");
    const rules = await prisma.approvalRule.findMany({
        where: { companyId: requester?.companyId },
        include: { subjectRole: true, approverRole: true }
    });
    console.log(`Found ${rules.length} approval rules.`);
    for (const rule of rules) {
        console.log(`Rule: ${rule.requestType} for ${rule.subjectRole?.name || 'ANY'} in ${rule.projectType || 'ANY'}`);
        console.log(`  Approver: ${rule.approverRole?.name || 'DEPT MGR'} Scope: ${rule.approverAreaConstraint}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
