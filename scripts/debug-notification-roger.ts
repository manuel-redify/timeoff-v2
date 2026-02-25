import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("--- Investigating Fay Valentine and Steve Rogers ---");

    const fay = await prisma.user.findFirst({
        where: { OR: [{ name: 'Fay' }, { lastname: 'Valentine' }] },
        include: {
            projects: { include: { project: true, role: true } },
            defaultRole: true,
            department: true,
            contractType: true
        }
    });

    const steve = await prisma.user.findFirst({
        where: { OR: [{ name: 'Steve' }, { lastname: 'Rogers' }] },
        include: {
            projects: { include: { project: true, role: true } },
            defaultRole: true,
            contractType: true
        }
    });

    if (fay) {
        console.log(`Fay Valentine ID: ${fay.id}, Auto-Approve: ${fay.isAutoApprove}, Contract: ${fay.contractType?.name}`);
        console.log("Fay's Projects:");
        fay.projects.forEach(up => {
            console.log(`- ${up.project.name} (ID: ${up.projectId}, Type: ${up.project.type}), Role: ${up.role?.name} (ID: ${up.roleId})`);
        });
    } else {
        console.log("Fay Valentine not found");
    }

    if (steve) {
        console.log(`Steve Rogers ID: ${steve.id}, Email: ${steve.email}, Default Role: ${steve.defaultRole?.name} (ID: ${steve.defaultRoleId})`);
        console.log("Steve's Projects:");
        steve.projects.forEach(up => {
            console.log(`- ${up.project.name} (ID: ${up.projectId}, Type: ${up.project.type}), Role: ${up.role?.name} (ID: ${up.roleId})`);
        });
    } else {
        console.log("Steve Rogers not found");
    }

    const requestId = '6b9d6e62-79cf-4bb0-8f6f-1bdcca236160';
    const request = await prisma.leaveRequest.findUnique({
        where: { id: requestId },
        include: {
            leaveType: true,
            approvalSteps: { include: { project: true } },
            user: { include: { company: true, projects: { include: { project: true } } } }
        }
    });

    if (request) {
        console.log(`\nRequest ${requestId} found:`);
        console.log(`Status: ${request.status}, Leave Type: ${request.leaveType.name} (ID: ${request.leaveTypeId}, Auto-Approve: ${request.leaveType.autoApprove})`);
        console.log(`Steps count: ${request.approvalSteps.length}`);

        console.log("\n--- Testing WatcherService.getWatchersForRequest logic manually ---");
        const { WatcherService } = await import('../lib/services/watcher.service');
        // Simulate providing the projectId (which we'd have in the request body in route.ts)
        const fayProjectId = fay?.projects[0]?.projectId;
        const watchers = await WatcherService.getWatchersForRequest(requestId, fayProjectId);
        console.log(`WatcherService found ${watchers.length} watchers: ${JSON.stringify(watchers)}`);
        if (steve && watchers.includes(steve.id)) {
            console.log("Steve Rogers IS in the watcher list.");
        } else {
            console.log("Steve Rogers IS NOT in the watcher list.");
        }
    } else {
        console.log(`\nRequest ${requestId} NOT found`);
    }

    const workflowId = '38f3ec2b-55ed-42b9-b107-b6f0e2ff6251';
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId }
    });

    if (workflow) {
        console.log(`\nWorkflow ${workflowId} found: ${workflow.name}`);
        console.log("Rules:", JSON.stringify(workflow.rules, null, 2));
    } else {
        // Try searching by name if ID might be different (e.g. policy ID)
        const workflows = await prisma.workflow.findMany();
        console.log(`\nWorkflow ${workflowId} NOT found. Available workflows:`);
        workflows.forEach(w => console.log(`- ${w.name} (ID: ${w.id})`));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
