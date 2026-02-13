import "dotenv/config";
import prisma from '../lib/prisma';
import { WorkflowResolverService } from '../lib/services/workflow-resolver-service';

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Peter', lastname: 'Parker' },
        include: { projects: { include: { project: true } } }
    });
    if (!user) return;
    const project = user.projects[0]?.project;

    const policies = await WorkflowResolverService.findMatchingPolicies(user.id, project?.id ?? null, 'LEAVE_REQUEST');
    console.log(`POLICIES_FOUND:${policies.length}`);

    const context = {
        request: { userId: user.id, requestType: 'LEAVE_REQUEST', projectId: project?.id, departmentId: user.departmentId, areaId: user.areaId },
        user,
        company: { id: user.companyId, roles: [], departments: [], projects: [], contractTypes: [] }
    };

    const resolution = await WorkflowResolverService.generateSubFlows(policies, context as any);
    console.log(`RESOLVERS_COUNT:${resolution.resolvers.length}`);

    for (const r of resolution.resolvers) {
        const u = await prisma.user.findUnique({ where: { id: r.userId } });
        console.log(`STEP:${r.step}|USER:${u?.name} ${u?.lastname}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
