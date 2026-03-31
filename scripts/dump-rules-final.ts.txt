import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    const rules = await prisma.approvalRule.findMany();
    console.log(JSON.stringify(rules, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
