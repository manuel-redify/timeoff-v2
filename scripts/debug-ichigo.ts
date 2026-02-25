import "dotenv/config";
import prisma from '../lib/prisma';
import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';

async function main() {
    console.log("--- Investigating Ichigo Kurosaki Data ---");
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'Ichigo', mode: 'insensitive' } },
                { lastname: { contains: 'Kurosaki', mode: 'insensitive' } }
            ]
        },
        include: {
            projects: {
                include: {
                    project: true,
                    role: true
                }
            },
            defaultRole: true,
            department: true,
            area: true,
            company: true,
            approvalSteps: true,
            leaveRequests: true
        }
    });

    if (!user) {
        console.log("Ichigo Kurosaki not found!");
        return;
    }

    console.log(`User: ${user.name} ${user.lastname} (ID: ${user.id})`);
    console.log(`Default Role: ${user.defaultRole?.name} (ID: ${user.defaultRoleId})`);
    console.log(`Contract Type: ${user.contractTypeId}`);
    console.log(`Department: ${user.department?.name} (ID: ${user.departmentId})`);
    console.log(`Company: ${user.company.name} (ID: ${user.companyId})`);

    console.log("\nProjects:");
    for (const up of user.projects) {
        console.log(`- Project: ${up.project.name} (ID: ${up.projectId}, Type: ${up.project.type})`);
        console.log(`  Status: ${up.project.status}, Archived: ${up.project.archived}`);
        console.log(`  Role: ${up.role?.name} (ID: ${up.roleId})`);
        console.log(`  Dates: ${up.startDate} to ${up.endDate ?? 'present'}`);
    }

    const requestDetails = await prisma.leaveRequest.findUnique({
        where: { id: '02fe1f0a-9225-4ac5-aa7f-f1909768aa4e' },
        include: { approvalSteps: true }
    });

    if (requestDetails) {
        console.log("\n--- Request Details (02fe1f0a-9225-4ac5-aa7f-f1909768aa4e) ---");
        const projectIdFromSteps = requestDetails.approvalSteps[0]?.projectId;
        console.log(`Project ID from Approval Steps: ${projectIdFromSteps}`);
        console.log(`Leave Type: ${requestDetails.leaveTypeId}`);
        console.log("Approval Steps in DB:");
        for (const step of requestDetails.approvalSteps) {
            console.log(`- Approver ID: ${step.approverId}, Status: ${step.status}`);
        }
    }

    console.log("\n--- Company Workflows ---");
    const workflows = await prisma.workflow.findMany({
        where: { companyId: user.companyId, isActive: true }
    });
    console.log(`Found ${workflows.length} active workflows.`);
    for (const w of workflows) {
        console.log(`- Workflow: ${w.name} (ID: ${w.id})`);
        console.log(`  Rules: ${JSON.stringify(w.rules, null, 2)}`);
    }

    const leaveTypeId = requestDetails ? requestDetails.leaveTypeId : (user.leaveRequests[0]?.leaveTypeId || '1b92b3d1-9074-41d3-97fe-0cbb0a924009');

    console.log("\n--- Testing findMatchingPolicies with projectId=null ---");
    const policiesNoProject = await WorkflowResolverService.findMatchingPolicies(
        user.id,
        null,
        'LEAVE',
        leaveTypeId
    );
    console.log(`Found ${policiesNoProject.length} policies.`);
    for (const p of policiesNoProject) {
        console.log(`- Policy: ${p.name} (Trigger Project: ${p.trigger.projectId})`);
    }

    if (user.projects.length > 0) {
        const firstProjectId = user.projects[0].projectId;
        console.log(`\n--- Testing findMatchingPolicies with projectId=${firstProjectId} ---`);
        const policiesWithProject = await WorkflowResolverService.findMatchingPolicies(
            user.id,
            firstProjectId,
            'LEAVE',
            leaveTypeId
        );
        console.log(`Found ${policiesWithProject.length} policies.`);
        for (const p of policiesWithProject) {
            console.log(`- Policy: ${p.name} (Trigger Project: ${p.trigger.projectId})`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
