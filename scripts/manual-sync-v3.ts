import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    const clerkId = "user_38InvxraVIKlfgfjs5yGPU6nRM9";
    const email = "manuel.magnani@deepmind.com";

    console.log(`Starting manual sync for Clerk ID: ${clerkId}`);

    try {
        // await prisma.$connect(); // Optional, prisma handles connection

        // Find default company first
        let company = await prisma.company.findFirst({
            where: { name: 'Default Company', deletedAt: null }
        });

        if (!company) {
            company = await prisma.company.findFirst({
                where: { deletedAt: null },
                orderBy: { createdAt: 'asc' }
            });
        }

        if (!company) throw new Error("No company found");

        const department = await prisma.department.findFirst({
            where: { companyId: company.id, name: 'General' }
        });

        if (!department) throw new Error("General department not found");

        console.log(`Using Company: ${company.name}, Department: ${department.name}`);

        const user = await prisma.user.upsert({
            where: { clerkId: clerkId },
            update: {
                isAdmin: true,
                activated: true,
                deletedAt: null,
            },
            create: {
                clerkId: clerkId,
                email: email,
                name: "Admin",
                lastname: "User",
                companyId: company.id,
                departmentId: department.id,
                defaultRoleId: company.defaultRoleId,
                isAdmin: true,
                activated: true,
                startDate: new Date(),
            }
        });

        console.log(`SUCCESS: User synced and granted Admin: ${user.email} (${user.id})`);

        // Double check All users count
        const count = await prisma.user.count();
        console.log(`Total users in DB now: ${count}`);

    } catch (e) {
        console.error("Error during manual sync:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
