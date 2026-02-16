import { PrismaClient } from '../lib/generated/prisma/client/index.js';

const prisma = new PrismaClient();

async function inspect() {
    console.log("Inspecting latest approval steps...");
    const steps = await prisma.approvalStep.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
            id: true,
            policyId: true,
            projectId: true,
            sequenceOrder: true,
            status: true,
            leaveId: true
        }
    });

    console.table(steps);
}

inspect()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
