import 'dotenv/config';
import prisma from './lib/prisma';

async function checkEmailAudits() {
  console.log('=== Email Audit Analysis ===');
  
  // Check all email audits
  const allAudits = await prisma.emailAudit.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: { select: { name: true, email: true } },
      company: { select: { name: true } }
    }
  });
  
  console.log(`📧 Total Email Audits: ${allAudits.length}`);
  allAudits.forEach(audit => {
    console.log(`   ${audit.createdAt.toISOString()} - ${audit.user?.email || 'Unknown'}: ${audit.subject}`);
  });
  
  // Check specifically for both users
  const manuelAudits = await prisma.emailAudit.count({
    where: { user: { email: 'manuel.magnani@redify.co' } }
  });
  
  const tonyAudits = await prisma.emailAudit.count({
    where: { user: { email: 'manuel.magnani+stark@redify.co' } }
  });
  
  console.log(`\n👥 Email Audit Count by User:`);
  console.log(`   Manuel Magnani: ${manuelAudits} email audits`);
  console.log(`   Tony Stark: ${tonyAudits} email audits`);
  
  await prisma.$disconnect();
}

checkEmailAudits().catch(console.error);