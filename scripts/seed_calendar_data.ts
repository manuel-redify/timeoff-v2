import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    const users = await prisma.user.findMany({ take: 3 });
    const leaveTypes = await prisma.leaveType.findMany({ take: 3 });

    if (users.length === 0 || leaveTypes.length === 0) {
        console.error("Users or LeaveTypes missing");
        return;
    }

    const january2026Absences = [
        {
            userId: users[0].id,
            leaveTypeId: leaveTypes[0].id,
            dateStart: new Date('2026-01-10'),
            dateEnd: new Date('2026-01-12'),
            status: 'APPROVED',
            employeeComment: 'January Trip'
        },
        {
            userId: users[1].id,
            leaveTypeId: leaveTypes[1 % leaveTypes.length].id,
            dateStart: new Date('2026-01-15'),
            dateEnd: new Date('2026-01-15'),
            status: 'NEW',
            employeeComment: 'Appointments'
        },
        {
            userId: users[2 % users.length].id,
            leaveTypeId: leaveTypes[2 % leaveTypes.length].id,
            dateStart: new Date('2026-01-20'),
            dateEnd: new Date('2026-01-22'),
            status: 'PENDING_REVOKE',
            employeeComment: 'Revoking this'
        }
    ];

    console.log("Seeding January 2026 absences...");
    for (const abs of january2026Absences) {
        await prisma.leaveRequest.create({
            data: {
                ...abs,
                status: abs.status as any,
                dayPartStart: 'ALL' as any,
                dayPartEnd: 'ALL' as any,
            }
        });
    }
    console.log("Seeding complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
