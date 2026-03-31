import "dotenv/config";
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log("Connected to DB directly via pg library");

        const sqlPath = path.join(process.cwd(), 'prisma', 'rls_policies.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Execute as one block
        await client.query(sql);
        console.log("Applied all RLS policies successfully");

    } catch (e) {
        console.error("Error applying RLS:", e);
    } finally {
        await client.end();
    }
}

main();
