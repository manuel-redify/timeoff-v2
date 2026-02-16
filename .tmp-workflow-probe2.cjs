require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const req = await client.query(`
    select lr.id, lr.user_id, lr.leave_type_id, lr.status, lr.created_at,
           u.department_id, u.name, u.lastname, d.name as department_name, d.boss_id
    from leave_requests lr
    join users u on u.id = lr.user_id
    left join departments d on d.id = u.department_id
    where lr.deleted_at is null
    order by lr.created_at desc
    limit 5
  `);

  console.log('LATEST_REQUESTS');
  console.log(JSON.stringify(req.rows, null, 2));

  if (req.rows.length > 0 && req.rows[0].department_id) {
    const depId = req.rows[0].department_id;
    const sup = await client.query('select user_id from department_supervisor where department_id = $1', [depId]);
    console.log('DEPARTMENT_SUPERVISORS', JSON.stringify(sup.rows, null, 2));
  }

  await client.end();
})();
