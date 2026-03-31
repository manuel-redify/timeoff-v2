import "dotenv/config";
import prisma from '../lib/prisma';
import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';

async function main() {
    console.log("--- Investigating Peter Parker Data ---");
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { name: { contains: 'Peter', mode: 'insensitive' } },
                { lastname: { contains: 'Parker', mode: 'insensitive' } }
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
            area: true
        }
    });

    if (!user) {
        console.log("Peter Parker not found!");
        return;
    }

    console.log(`User: ${user.name} ${user.lastname} (ID: ${user.id})`);
    console.log(`Default Role: ${user.defaultRole?.name} (ID: ${user.defaultRoleId})`);
    console.log(`Department: ${user.department?.name} (ID: ${user.departmentId})`);

    console.log("\nProjects:");
    for (const up of user.projects) {
        console.log(`- Project: ${up.project.name} (${up.project.type})`);
        console.log(`  Role: ${up.role?.name} (ID: ${up.roleId})`);
    }

    console.log("\n--- Checking Policies ---");
    // Find matching policies for the first project Peter is assigned to
    const projectInterest = user.projects[0]?.project;
    if (projectInterest) {
        console.log(`\nTesting policies for Project: ${projectInterest.name}`);
        const policies = await WorkflowResolverService.findMatchingPolicies(
            user.id,
            projectInterest.id,
            'LEAVE'
        );

        console.log(`Found ${policies.length} policies.`);
        for (const policy of policies) {
            console.log(`\nPolicy: ${policy.name}`);
            console.log("Steps:");
            for (const step of policy.steps) {
                console.log(`- Sequence ${step.sequence}: ${step.resolver} (ID: ${step.resolverId}) Scope: ${step.scope}`);
            }
        }

        console.log("\n--- Resolving Steps ---");
        const company = await prisma.company.findUnique({
            where: { id: user.companyId },
            include: {
                roles: true,
                departments: true,
                projects: true,
                contractTypes: true
            }
        });

        if (company && policies.length > 0) {
            const context = {
                request: {
                    userId: user.id,
                    requestType: 'LEAVE',
                    projectId: projectInterest.id,
                    departmentId: user.departmentId || undefined,
                    areaId: user.areaId || undefined
                },
                user,
                company
            };

            const resolution = await WorkflowResolverService.generateSubFlows(policies, context as any);
            console.log("\nResolution:");
            for (const subFlow of resolution.subFlows) {
                console.log(`SubFlow for policy: ${subFlow.origin.policyName}`);
                for (const group of subFlow.stepGroups) {
                    console.log(`  Step ${group.sequence}:`);
                    for (const step of group.steps) {
                        console.log(`    - ResolverIds: ${JSON.stringify(step.resolverIds)} fallback: ${step.fallbackUsed}`);
                    }
                }
            }
        }
    } else {
        console.log("No projects found for user.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
