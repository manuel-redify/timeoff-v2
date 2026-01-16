import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

async function main() {
    const sqlPath = path.join(process.cwd(), 'prisma', 'rls_policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split by statement to execute individually if needed, or execute raw.
    // Prisma executeRaw supports multiple statements in some drivers, but safer to split.
    // Neon (Postgres) usually handles it.

    console.log('Applying RLS policies...');

    // Basic splitting by semicolon, ignoring potential semicolons in strings for simplicity
    // Ideally use a proper parser or just execute the whole block if supported.
    // We'll try executing the whole block first.

    try {
        await prisma.$executeRawUnsafe(sql);
        console.log('RLS policies applied successfully.');
    } catch (e) {
        console.error('Error applying RLS policies:', e);

        // Fallback: split by statement
        console.log('Retrying by splitting statements...');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
            } catch (innerE) {
                console.error(`Failed to execute statement: ${statement.substring(0, 50)}...`, innerE);
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
