import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL;
    console.log("Checking admin status for:", adminEmail);

    const users = await prisma.user.findMany({
        select: {
            email: true,
            isAdmin: true
        }
    });

    console.log("Current users in DB:");
    users.forEach(u => {
        console.log(`- ${u.email}: isAdmin=${u.isAdmin}`);
    });

    if (adminEmail) {
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (admin && !admin.isAdmin) {
            console.log("User found but not admin. Fixing...");
            await prisma.user.update({
                where: { email: adminEmail },
                data: { isAdmin: true }
            });
            console.log("Fixed!");
        } else if (!admin) {
            console.log("Admin user not found in DB.");
        } else {
            console.log("Admin user is already marked as admin.");
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
