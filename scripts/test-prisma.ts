import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
    console.log("Starting test...");
    try {
        console.log("Client imported");
        await prisma.$connect();
        console.log("Connected!");
        const count = await prisma.leaveType.count();
        console.log(`Leave types count: ${count}`);
        await prisma.$disconnect();
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
