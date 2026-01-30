import "dotenv/config";
import prisma from './lib/prisma';

async function main() {
    console.log('--- Database Check ---');
    try {
        // Check Company
        const companies = await prisma.company.findMany();
        console.log(`Total companies: ${companies.length}`);
        companies.forEach(c => console.log(`- Company: ${c.name} (${c.id}) Created: ${c.createdAt}`));

        // Check Department
        const departments = await prisma.department.findMany();
        console.log(`Total departments: ${departments.length}`);
        departments.forEach(d => console.log(`- Department: ${d.name} (${d.id})`));

        // Check Users
        const users = await prisma.user.findMany({
            include: {
                company: true,
                department: true
            }
        });
        console.log(`\nTotal users: ${users.length}`);
        users.forEach(u => {
            console.log(`- ${u.name} ${u.lastname} (${u.email}) [Clerk ID: ${u.clerkId}] -> Company: ${u.company?.name}`);
        });

    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
