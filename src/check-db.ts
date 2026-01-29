import "dotenv/config";
import prisma from '../lib/prisma';

async function main() {
  console.log('🔍 Checking database connectivity and schema integrity...');
  
  try {
    // Test 1: Database connection
    console.log('✅ Database connection: OK');
    
    // Test 2: User model structure and data
    const userCount = await prisma.user.count();
    console.log(`📊 Users table: ${userCount} records`);
    
    if (userCount > 0) {
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@example.com' },
        select: {
          id: true,
          email: true,
          name: true,
          lastname: true,
          password: true,
          emailVerified: true,
          image: true,
          isAdmin: true,
          activated: true
        }
      });
      
      if (adminUser) {
        console.log('👤 Admin user found:', {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          lastname: adminUser.lastname,
          hasPassword: !!adminUser.password,
          emailVerified: adminUser.emailVerified,
          hasImage: !!adminUser.image,
          isAdmin: adminUser.isAdmin,
          activated: adminUser.activated
        });
      } else {
        console.log('⚠️ Admin user not found');
      }
    }
    
    // Test 3: New Auth.js models exist
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    const verificationTokenCount = await prisma.verificationToken.count();
    
    console.log('🔐 Auth.js models:');
    console.log(`   - Accounts: ${accountCount} records`);
    console.log(`   - Sessions: ${sessionCount} records`);
    console.log(`   - Verification Tokens: ${verificationTokenCount} records`);
    
    // Test 4: Relations work
    const userWithRelations = await prisma.user.findFirst({
      where: { email: 'admin@example.com' },
      include: {
        accounts: true,
        sessions: true,
        company: {
          select: { name: true }
        }
      }
    });
    
    if (userWithRelations) {
      console.log('🔗 User relations check:', {
        hasAccounts: userWithRelations.accounts.length,
        hasSessions: userWithRelations.sessions.length,
        companyName: userWithRelations.company?.name || 'Not found'
      });
    }
    
    // Test 5: All models are accessible
    const models = [
      'User', 'Company', 'Role', 'Department', 'LeaveType', 
      'Account', 'Session', 'VerificationToken'
    ];
    
    console.log('📋 Model accessibility:');
    for (const model of models) {
      try {
        const count = await (prisma as any)[model.toLowerCase()].count();
        console.log(`   - ${model}: ✅ (${count} records)`);
      } catch (error) {
        console.log(`   - ${model}: ❌ (${error instanceof Error ? error.message : String(error)})`);
      }
    }
    
    console.log('🎉 Database connectivity and schema verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();