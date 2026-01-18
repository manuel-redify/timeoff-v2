import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    try {
        const result: any = await prisma.$queryRaw`SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('leave_types', 'companies', 'users');`;
        console.log("RLS Status:");
        console.table(result);

        const policies: any = await prisma.$queryRaw`SELECT * FROM pg_policies WHERE tablename = 'leave_types';`;
        console.log("LeaveType Policies:");
        console.table(policies);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
