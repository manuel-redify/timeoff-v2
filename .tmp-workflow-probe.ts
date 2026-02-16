import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './lib/generated/prisma/client.ts';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const workflowCount = await prisma.comment.count({ where: { entityType: 'WORKFLOW_POLICY' } });
  const watcherRuleCount = await prisma.watcherRule.count();
  console.log(JSON.stringify({ workflowCount, watcherRuleCount }, null, 2));

  const latestPolicies = await prisma.comment.findMany({
    where: { entityType: 'WORKFLOW_POLICY' },
    orderBy: { at: 'desc' },
    take: 5,
    select: { entityId: true, at: true, comment: true }
  });

  console.log('LATEST_POLICIES');
  for (const p of latestPolicies) {
    let parsed: any = null;
    try { parsed = JSON.parse(p.comment); } catch {}
    console.log(JSON.stringify({
      entityId: p.entityId,
      at: p.at,
      name: parsed?.name,
      isActive: parsed?.isActive,
      requestTypes: parsed?.requestTypes,
      watchersCount: Array.isArray(parsed?.watchers) ? parsed.watchers.length : 0,
      watchers: parsed?.watchers
    }, null, 2));
  }

  const watcherRules = await prisma.watcherRule.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: {
      id: true,
      requestType: true,
      projectType: true,
      roleId: true,
      teamId: true,
      projectId: true,
      teamScopeRequired: true,
      contractTypeId: true,
      companyId: true,
      updatedAt: true,
    }
  });

  console.log('WATCHER_RULES');
  console.log(JSON.stringify(watcherRules, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
