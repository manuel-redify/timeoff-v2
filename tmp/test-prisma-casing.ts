
import prisma from '../lib/prisma';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const user = await prisma.user.findFirst({
        where: { name: 'Peter' }
    });

    const yearStart = new Date('2026-01-01');
    const yearEnd = new Date('2026-12-31');

    const withUppercase = await prisma.leaveRequest.count({
        where: {
            userId: user.id,
            deletedAt: null,
            status: 'APPROVED' as any,
            dateStart: { lte: yearEnd },
            dateEnd: { gte: yearStart },
            leaveType: { useAllowance: true },
        }
    });

    const withLowercase = await prisma.leaveRequest.count({
        where: {
            userId: user.id,
            deletedAt: null,
            status: 'approved' as any,
            dateStart: { lte: yearEnd },
            dateEnd: { gte: yearStart },
            leaveType: { useAllowance: true },
        }
    });

    console.log({ withUppercase, withLowercase });

    process.exit(0);
}

main().catch(console.error);
