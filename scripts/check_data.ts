import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    const users = await prisma.user.findMany({
        include: {
            company: true,
            department: true,
        }
    });

    console.log('--- USERS ---');
    users.forEach(u => {
        console.log(`${u.name} ${u.lastname} (${u.email}) - Admin: ${u.isAdmin}`);
        console.log(`  ID: ${u.id}`);
        console.log(`  Token: ${u.icalFeedToken}`);
        console.log(`  Company: ${u.company.name} (Share: ${u.company.shareAllAbsences}, Hidden: ${u.company.isTeamViewHidden})`);
        console.log(`  Dept: ${u.department?.name || 'None'}`);
    });

    const leaveRequests = await prisma.leaveRequest.findMany({
        include: { user: true }
    });
    console.log('\n--- LEAVE REQUESTS ---');
    leaveRequests.forEach(lr => {
        console.log(`${lr.user.name}: ${lr.dateStart.toLocaleDateString()} to ${lr.dateEnd.toLocaleDateString()} - Status: ${lr.status}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
