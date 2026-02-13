import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("=== DEBUGGING TRIGGER KEYS ===");
    const user = await prisma.user.findFirst({ where: { name: 'Peter' } });
    const rules = await prisma.approvalRule.findMany({
        where: { companyId: user?.companyId, subjectRoleId: user?.defaultRoleId }
    });

    console.log(`Found ${rules.length} rules for Developer role.`);
    rules.forEach(r => {
        console.log(`Rule ID: ${r.id}`);
        console.log(`  requestType: ${r.requestType}`);
        console.log(`  projectType: ${r.projectType}`);
        console.log(`  subjectRoleId: ${r.subjectRoleId}`);
        console.log(`  subjectAreaId: ${r.subjectAreaId}`);
        const triggerKey = `${r.companyId}:${r.requestType}:${r.projectType || 'null'}:${r.subjectRoleId || 'null'}:${r.subjectAreaId || 'null'}`;
        console.log(`  Calculated TriggerKey: ${triggerKey}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
