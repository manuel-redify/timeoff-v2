require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const wf = await client.query("select count(*)::int as workflow_count from comments where entity_type='WORKFLOW_POLICY'");
  const wrCount = await client.query("select count(*)::int as watcher_rule_count from watcher_rules");
  console.log(JSON.stringify({ workflowCount: wf.rows[0].workflow_count, watcherRuleCount: wrCount.rows[0].watcher_rule_count }, null, 2));

  const policies = await client.query("select entity_id, at, comment from comments where entity_type='WORKFLOW_POLICY' order by at desc limit 10");
  console.log('LATEST_POLICIES');
  for (const row of policies.rows) {
    let parsed = null;
    try { parsed = JSON.parse(row.comment); } catch {}
    console.log(JSON.stringify({
      entityId: row.entity_id,
      at: row.at,
      name: parsed?.name,
      isActive: parsed?.isActive,
      requestTypes: parsed?.requestTypes,
      watchersCount: Array.isArray(parsed?.watchers) ? parsed.watchers.length : 0,
      watchers: parsed?.watchers ?? []
    }, null, 2));
  }

  const watcherRules = await client.query("select id, request_type, project_type, role_id, team_id, project_id, team_scope_required, contract_type_id, company_id, updated_at from watcher_rules order by updated_at desc limit 50");
  console.log('WATCHER_RULES');
  console.log(JSON.stringify(watcherRules.rows, null, 2));

  await client.end();
})();
