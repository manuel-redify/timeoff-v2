require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const req = await client.query(`
    select lr.id, lr.leave_type_id, lr.user_id, u.department_id, d.boss_id
    from leave_requests lr
    join users u on u.id = lr.user_id
    left join departments d on d.id = u.department_id
    where lr.deleted_at is null
    order by lr.created_at desc
    limit 1
  `);

  const row = req.rows[0];
  console.log('LATEST_REQUEST', JSON.stringify(row, null, 2));

  const policy = await client.query("select entity_id, comment from comments where entity_type='WORKFLOW_POLICY' order by at desc limit 1");
  const parsed = JSON.parse(policy.rows[0].comment);
  console.log('LATEST_POLICY_REQUEST_TYPES', parsed.requestTypes);
  console.log('MATCHES_LEAVE_TYPE_ID', parsed.requestTypes.includes(row.leave_type_id));

  const boss = await client.query('select id, email, activated, deleted_at from users where id=$1', [row.boss_id]);
  console.log('BOSS_USER', JSON.stringify(boss.rows[0], null, 2));

  const pref = await client.query("select type, channel from notification_preferences where user_id=$1 and type in ('LEAVE_SUBMITTED','LEAVE_APPROVED','LEAVE_REJECTED') order by type", [row.boss_id]);
  console.log('BOSS_PREFS', JSON.stringify(pref.rows, null, 2));

  await client.end();
})();
