const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const email = 'manuel.magnani+parker@redify.co';
  const password = 'TempPassword123!';
  const result = await client.query('select email, name, lastname, activated, password from users where email = $1', [email]);
  if (result.rows.length === 0) {
    console.log(JSON.stringify({ exists: false }, null, 2));
    await client.end();
    return;
  }
  const user = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, user.password || '');
  console.log(JSON.stringify({
    exists: true,
    email: user.email,
    name: user.name,
    lastname: user.lastname,
    activated: user.activated,
    passwordMatches,
  }, null, 2));
  await client.end();
})().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
