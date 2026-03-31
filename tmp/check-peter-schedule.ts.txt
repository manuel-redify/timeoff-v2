
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

    const userSchedule = await prisma.schedule.findFirst({
        where: { userId: user.id }
    });

    const companySchedule = await prisma.schedule.findFirst({
        where: { companyId: user.companyId, userId: null }
    });

    console.log('Peter Schedule:', userSchedule);
    console.log('Company Schedule:', companySchedule);

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
