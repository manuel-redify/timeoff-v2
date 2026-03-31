
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const userRes = await pool.query(`SELECT id, name, lastname FROM users WHERE name = 'Peter' LIMIT 1`);
    const user = userRes.rows[0];

    const yearStart = `2026-01-01`;
    const yearEnd = `2026-12-31`;

    const approvedRes = await pool.query(
        `SELECT lr.id, lr.date_start, lr.date_end, lr.day_part_start, lr.day_part_end, lr.duration_minutes, lr.status
     FROM leave_requests lr
     JOIN leave_types lt ON lt.id = lr.leave_type_id
     WHERE lr.user_id = $1
       AND lr.deleted_at IS NULL
       AND lr.status = 'approved'
       AND lr.date_start <= $3
       AND lr.date_end >= $2
       AND lt.use_allowance = true`,
        [user.id, yearStart, yearEnd]
    );

    const allStatusRes = await pool.query(
        `SELECT DISTINCT status FROM leave_requests WHERE user_id = $1 AND deleted_at IS NULL`,
        [user.id]
    );

    const result = {
        user,
        approvedCount: approvedRes.rows.length,
        approved: approvedRes.rows,
        allStatuses: allStatusRes.rows.map(r => r.status)
    };

    fs.writeFileSync('tmp/peter_data.json', JSON.stringify(result, null, 2));

    await pool.end();
}

main().catch(console.error);
