require('dotenv/config');

const prisma = require('../lib/prisma.ts').default;
const { WorkflowResolverService } = require('../lib/services/workflow-resolver-service.ts');

function percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[idx];
}

async function main() {
    const activeWorkflow = await prisma.workflow.findFirst({
        where: { isActive: true },
        select: { companyId: true }
    });

    if (!activeWorkflow) {
        console.log('[WORKFLOW_BENCH] No active workflows found.');
        return;
    }

    const user = await prisma.user.findFirst({
        where: {
            companyId: activeWorkflow.companyId,
            activated: true,
            deletedAt: null,
        },
        include: {
            company: true,
            projects: {
                where: {
                    project: {
                        archived: false,
                        status: 'ACTIVE'
                    }
                },
                include: { project: true }
            }
        }
    });

    if (!user) {
        console.log('[WORKFLOW_BENCH] No eligible user found.');
        return;
    }

    const projectId = user.projects[0]?.projectId ?? null;
    const iterations = 30;
    const warmups = 3;
    const timings = [];

    for (let i = 0; i < warmups + iterations; i++) {
        const startedAt = Date.now();
        const policies = await WorkflowResolverService.findMatchingPolicies(
            user.id,
            projectId,
            'LEAVE_REQUEST'
        );

        await WorkflowResolverService.generateSubFlows(policies, {
            request: {
                userId: user.id,
                requestType: 'LEAVE_REQUEST',
                projectId: projectId ?? undefined,
                departmentId: user.departmentId ?? undefined,
                areaId: user.areaId ?? undefined,
            },
            user: user,
            company: {
                id: user.companyId,
                roles: [],
                departments: [],
                projects: [],
                contractTypes: [],
            }
        });
        const elapsed = Date.now() - startedAt;
        if (i >= warmups) timings.push(elapsed);
    }

    const p50 = percentile(timings, 50);
    const p95 = percentile(timings, 95);
    const avg = timings.reduce((sum, value) => sum + value, 0) / timings.length;
    const targetMs = 200;

    console.log(`[WORKFLOW_BENCH] user=${user.id} project=${projectId ?? 'global'} iterations=${iterations}`);
    console.log(`[WORKFLOW_BENCH] avg=${avg.toFixed(2)}ms p50=${p50}ms p95=${p95}ms target<${targetMs}ms`);
    console.log(`[WORKFLOW_BENCH] target_status=${p95 < targetMs ? 'PASS' : 'FAIL'}`);
}

main()
    .catch((error) => {
        console.error('[WORKFLOW_BENCH] Failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
