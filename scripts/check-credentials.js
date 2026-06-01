require("dotenv/config");

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

async function main() {
  const email = process.env.CHECK_EMAIL?.trim().toLowerCase();
  const password = process.env.CHECK_PASSWORD;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (!email || !password) {
    throw new Error("Set CHECK_EMAIL and CHECK_PASSWORD before running this script.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query(
      `select id, email, activated, password, deleted_at from users where email = $1 limit 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      console.log("User found: no");
      return;
    }

    const passwordMatches = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    console.log("User found: yes");
    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Activated: ${user.activated}`);
    console.log(`Deleted: ${user.deleted_at ? "yes" : "no"}`);
    console.log(`Has password hash: ${user.password ? "yes" : "no"}`);
    console.log(`Password matches: ${passwordMatches ? "yes" : "no"}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
