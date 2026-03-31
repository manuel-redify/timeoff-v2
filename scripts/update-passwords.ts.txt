import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

// Explicitly load .env.local to override .env
require('dotenv').config({ path: '.env.local' });

async function updatePasswords() {
    const newPassword = process.env.DEV_DEFAULT_PASSWORD;
    
    if (!newPassword) {
        console.error('❌ DEV_DEFAULT_PASSWORD not found in environment variables');
        return;
    }

    console.log(`🔧 Updating all user passwords to: ${newPassword}`);
    
    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Update all users' passwords
        const result = await prisma.user.updateMany({
            where: {
                // Only update users who have a password (not null)
                password: {
                    not: null
                }
            },
            data: {
                password: hashedPassword
            }
        });
        
        console.log(`✅ Updated passwords for ${result.count} users`);
        
        // Verify update by checking a few users
        const users = await prisma.user.findMany({
            select: {
                email: true,
                name: true,
                lastname: true
            },
            take: 3
        });
        
        console.log('\n📋 Sample updated users:');
        users.forEach(user => {
            console.log(`   ${user.name} ${user.lastname} (${user.email})`);
        });
        
    } catch (error) {
        console.error('❌ Error updating passwords:', error);
    }
}

updatePasswords()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });