import "dotenv/config";
import prisma from '../lib/prisma';
import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';

async function main() {
    console.log("=== VERIFYING WORKFLOW FIX ===");

    const user = await prisma.user.findFirst({
        where: { name: 'Peter', lastname: 'Parker' },
        include: { company: true, projects: { include: { project: true } } }
    });

    if (!user) {
        console.error("User Peter Parker not found");
        return;
    }

    const project = user.projects[0]?.project;

    // 1. Find Matching Policies
    console.log(`Running findMatchingPolicies for Peter Parker (Project: ${project?.name})...`);
    const policies = await WorkflowResolverService.findMatchingPolicies(
        user.id,
        project?.id ?? null,
        'LEAVE_REQUEST'
    );

    console.log(`Found ${policies.length} policies.`);
    policies.forEach((p, i) => {
        console.log(`Policy ${i + 1}: ${p.name}`);
        p.steps.forEach((s, j) => {
            console.log(`  Step ${j + 1}: Resolver=${s.resolver}, ID=${s.resolverId}, Scope=${s.scope}`);
        });
    });

    if (policies.length === 0) {
        console.error("No policies matched!");
        return;
    }

    // 2. Generate SubFlows
    console.log("\nGenerating SubFlows...");
    const context = {
        request: {
            userId: user.id,
            requestType: 'LEAVE_REQUEST',
            projectId: project?.id,
            departmentId: user.departmentId ?? undefined,
            areaId: user.areaId ?? undefined,
        },
        user: user as any,
        company: {
            id: user.companyId,
            roles: [],
            departments: [],
            projects: [],
            contractTypes: [],
        }
    };

    const resolution = await WorkflowResolverService.generateSubFlows(policies, context as any);

    console.log("\n--- Resolution Results ---");
    const resolvers = resolution.resolvers;
    console.log(`Total Resolvers: ${resolvers.length}`);

    resolvers.forEach((r, i) => {
        // Fetch user name for display
        process.stdout.write(`Step ${r.step}: UserID=${r.userId}`);
    });
    console.log(""); // newline

    // Fetch actual names for better verification output
    const resolvedUsers = await prisma.user.findMany({
        where: { id: { in: resolvers.map(r => r.userId) } }
    });

    resolvers.forEach(r => {
        const u = resolvedUsers.find(user => user.id === r.userId);
        console.log(`Step ${r.step}: ${u?.name} ${u?.lastname}`);
    });

    // Final Assertion (Visual)
    const names = resolvers.map(r => {
        const u = resolvedUsers.find(user => user.id === r.userId);
        return u?.name;
    });

    const expected = ['Tony', 'Steve'];
    const success = names.length === 2 && names[0] === 'Tony' && names[1] === 'Steve';

    if (success) {
        console.log("\n✅ SUCCESS: Workflow correctly routed to Tony Stark (Tech Lead) then Steve Rogers (Project Manager).");
    } else {
        console.log("\n❌ FAILURE: Workflow did not route as expected.");
        console.log("Expected: Tony, Steve");
        console.log("Actual:", names.join(", "));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
