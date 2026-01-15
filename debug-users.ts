import "dotenv/config";
import prisma from './lib/prisma';

async function main() {
    console.log('--- Database User Check ---');
    try {
        const users = await prisma.user.findMany({
            include: {
                company: true,
                department: true
            }
        });
        console.log(`Total users found: ${users.length}`);
        users.forEach(u => {
            console.log(`- ${u.name} ${u.lastname} (${u.email}) [Clerk ID: ${u.clerkId}]`);
        });
    } catch (e) {
        console.error('Error querying users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
