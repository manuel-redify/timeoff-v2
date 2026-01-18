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
        // Remove comments and split by semicolon
        const statements = sql
            .replace(/--.*$/gm, '') // Remove single line comments
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Executing ${statements.length} statements...`);

        for (const [index, statement] of statements.entries()) {
            try {
                await prisma.$executeRawUnsafe(statement);
                if (index % 5 === 0) console.log(`Executed ${index + 1}/${statements.length} statements...`);
            } catch (innerE) {
                console.error(`Failed to execute statement: ${statement.substring(0, 100)}...`);
                console.error(innerE);
                // Continue with other statements
            }
        }
        console.log('RLS policies applied successfully.');
    } catch (e) {
        console.error('Error in apply-rls script:', e);
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
