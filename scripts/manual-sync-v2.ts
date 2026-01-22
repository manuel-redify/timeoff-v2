import "dotenv/config";
import { PrismaClient } from '@prisma/client';

async function main() {
    // Explicitly create client to avoid any global state issues
    const prisma = new PrismaClient();

    const clerkId = "user_38InvxraVIKlfgfjs5yGPU6nRM9";
    const email = "manuel.magnani@deepmind.com";

    console.log(`Starting manual sync for Clerk ID: ${clerkId}`);

    try {
        await prisma.$connect();

        // Find default company and department
        let company = await prisma.company.findFirst({
            where: { name: { not: 'Default Company' }, deletedAt: null },
            orderBy: { createdAt: 'asc' }
        });

        if (!company) {
            company = await prisma.company.findFirst({ where: { name: 'Default Company' } });
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

        // Verify immediately
        const verified = await prisma.user.findUnique({ where: { clerkId: clerkId } });
        console.log("Immediate Verification:", !!verified);

    } catch (e) {
        console.error("Error during manual sync:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
