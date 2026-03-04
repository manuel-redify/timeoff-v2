
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Peter' }
    });

    if (!user) {
        console.log('User Peter not found');
        return;
    }

    const requests = await prisma.leaveRequest.findMany({
        where: { userId: user.id, deletedAt: null },
        include: { leaveType: true }
    });

    console.log('Peter requests:');
    requests.forEach(req => {
        console.log(`- ID: ${req.id}`);
        console.log(`  Status: ${req.status}`);
        console.log(`  Start: ${req.dateStart.toISOString()}`);
        console.log(`  End: ${req.dateEnd.toISOString()}`);
        console.log(`  DurationMinutes in DB: ${req.durationMinutes}`);
        console.log(`  LeaveType: ${req.leaveType.name}, UseAllowance: ${req.leaveType.useAllowance}`);
    });

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
