import 'dotenv/config';
import prisma from './lib/prisma';

async function checkUsers() {
  console.log('=== User Investigation ===\n');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: { 
        company: true,
        notificationPreferences: true
      },
      take: 10
    });
    
    console.log(`📋 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   ${user.id}: ${user.name} ${user.lastname} (${user.email})`);
      console.log(`     Company: ${user.company.name}`);
      console.log(`     User ID: ${user.id}`);
      console.log(`     Admin: ${user.isAdmin}`);
      console.log('');
    });
    
    // Check for any "Tony" or "Stark" users
    const tonyUsers = users.filter(u => 
      u.name.toLowerCase().includes('tony') || 
      u.lastname.toLowerCase().includes('stark') ||
      u.email.toLowerCase().includes('tony') ||
      u.email.toLowerCase().includes('stark')
    );
    
    if (tonyUsers.length > 0) {
      console.log(`🔍 Found ${tonyUsers.length} potential Tony Stark users:`);
      tonyUsers.forEach(user => {
        console.log(`   ${user.id}: ${user.name} ${user.lastname} (${user.email})`);
      });
    } else {
      console.log('❌ No Tony Stark users found');
    }
    
    // Check notification preferences for all users
    const allPreferences = await prisma.notificationPreference.findMany({
      include: {
        user: {
          select: { name: true, lastname: true, email: true }
        }
      }
    });
    
    console.log(`\n📊 All Notification Preferences (${allPreferences.length} total):`);
    const groupedPreferences = allPreferences.reduce((acc, pref) => {
      const userEmail = pref.user.email;
      if (!acc[userEmail]) {
        acc[userEmail] = [];
      }
      acc[userEmail].push(`${pref.type}: ${pref.channel}`);
      return acc;
    }, {} as Record<string, string[]>);
    
    Object.entries(groupedPreferences).forEach(([email, prefs]) => {
      console.log(`   ${email}:`);
      prefs.forEach(pref => console.log(`     - ${pref}`));
    });
    
  } catch (error) {
    console.error('❌ Error during user investigation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
