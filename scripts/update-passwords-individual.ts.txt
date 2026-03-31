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
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        
        // Get all users first
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true }
        });
        
        console.log(`Found ${users.length} users to update`);
        
        // Update each user individually
        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });
            console.log(`✅ Updated password for ${user.name} (${user.email})`);
        }
        
        console.log(`\n🎉 Successfully updated ${users.length} user passwords`);
        
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