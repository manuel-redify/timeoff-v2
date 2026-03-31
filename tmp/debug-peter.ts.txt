
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../lib/generated/prisma/client';
import { LeaveStatus } from '../lib/generated/prisma/enums';
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

    console.log(`Found user: ${user.name} ${user.lastname} (${user.id})`);

    const targetYear = new Date().getFullYear();
    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    // Direct DB query using the enum (which maps to lowercase 'approved' in the DB)
    const approved = await prisma.leaveRequest.findMany({
        where: {
            userId: user.id,
            deletedAt: null,
            status: LeaveStatus.APPROVED,
            dateStart: { lte: yearEnd },
            dateEnd: { gte: yearStart },
            leaveType: { useAllowance: true },
        },
        select: {
            id: true,
            dateStart: true,
            dateEnd: true,
            dayPartStart: true,
            dayPartEnd: true,
            durationMinutes: true,
        }
    });

    console.log(`\nApproved leave requests for Peter in ${targetYear}:`);
    if (approved.length === 0) {
        console.log('  None found — enum query returning empty. Checking raw status values...');

        // Fall back to checking what's actually in the DB
        const all = await prisma.leaveRequest.findMany({
            where: { userId: user.id, deletedAt: null },
            select: { id: true, status: true, dateStart: true, dateEnd: true }
        });
        console.log(`  All requests (${all.length}):`, all.map(r => ({ status: r.status, start: r.dateStart })));
    } else {
        for (const r of approved) {
            console.log(`  Request ${r.id}: ${r.dateStart.toISOString().split('T')[0]} to ${r.dateEnd.toISOString().split('T')[0]}, durationMinutes=${r.durationMinutes}`);
        }
    }

    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
