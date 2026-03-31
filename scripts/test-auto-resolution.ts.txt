import "dotenv/config";
import prisma from '../lib/prisma';
import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';

async function main() {
    // 1. Get Peter Parker
    const user = await prisma.user.findFirst({
        where: { name: 'Peter', lastname: 'Parker' },
    });
    if (!user) {
        console.error("User Peter Parker not found");
        return;
    }

    console.log("--- Testing with NULL Project ID (Automatic Resolution) ---");
    const policies = await WorkflowResolverService.findMatchingPolicies(user.id, null, 'LEAVE_REQUEST');
    console.log(`POLICIES_FOUND: ${policies.length}`);

    for (const policy of policies) {
        console.log(`POLICY: ${policy.name} (Trigger Project: ${policy.trigger.projectId || 'Global'})`);

        const context = {
            request: {
                userId: user.id,
                requestType: 'LEAVE_REQUEST',
                projectId: null, // User did not select a project
                departmentId: user.departmentId,
                areaId: user.areaId
            },
            user,
            company: { id: user.companyId, roles: [], departments: [], projects: [], contractTypes: [] }
        };

        const resolution = await WorkflowResolverService.generateSubFlows([policy], context as any);
        console.log(`  RESOLVERS_COUNT: ${resolution.resolvers.length}`);

        for (const r of resolution.resolvers) {
            const u = await prisma.user.findUnique({ where: { id: r.userId } });
            console.log(`  STEP: ${r.step} | USER: ${u?.name} ${u?.lastname}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
