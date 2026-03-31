import "dotenv/config";
import { PrismaClient } from '../lib/generated/prisma/client';

async function main() {
    const prisma = new PrismaClient({
        // @ts-ignore
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });
    console.log('Seeding...');
    await prisma.$connect();
    console.log('Connected');
    await prisma.$disconnect();
}

main().catch(console.error);
