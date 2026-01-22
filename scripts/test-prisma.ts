import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("Starting test...");
    try {
        console.log("Client imported");
        await prisma.$connect();
        console.log("Connected!");
        const clerkId = "user_38InvxraVIKlfgfjs5yGPU6nRM9";
        const user = await prisma.user.findUnique({ where: { clerkId: clerkId } });
        console.log(`User for ${clerkId}:`, JSON.stringify(user, null, 2));

        const allUsers = await prisma.user.findMany({ select: { clerkId: true } });
        console.log("All Clerk IDs:", allUsers.map(u => u.clerkId));
        await prisma.$disconnect();
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
