import "dotenv/config";
import { PrismaClient } from '@prisma/client';

async function main() {
    console.log("Starting test...");
    try {
        const prisma = new PrismaClient();
        console.log("Client created");
        await prisma.$connect();
        console.log("Connected!");
        await prisma.$disconnect();
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
