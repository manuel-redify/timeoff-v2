import 'dotenv/config';
import { NotificationService } from './lib/services/notification.service';
import prisma from './lib/prisma';

async function testTonyNotifications() {
  console.log('=== Testing Tony Stark Email Notifications ===\n');
  
  const tonyId = 'adf1bcb4-33bc-40de-b2f3-7903e4fe71ea';
  
  // Get Tony's user info
  const tony = await prisma.user.findUnique({
    where: { id: tonyId },
    select: { email: true, name: true, lastname: true, companyId: true }
  });
  
  if (!tony) {
    console.log('❌ Tony Stark not found');
    return;
  }
  
  console.log(`✅ Found Tony Stark: ${tony.name} ${tony.lastname} (${tony.email})`);
  console.log(`🔑 RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Configured' : 'NOT CONFIGURED'}\n`);
  
  // Test LEAVE_SUBMITTED notification (this should create email audit)
  console.log('🧪 Testing LEAVE_SUBMITTED notification...');
  try {
    await NotificationService.notify(
      tonyId,
      'LEAVE_SUBMITTED',
      {
        requesterName: `${tony.name} ${tony.lastname}`,
        leaveType: 'Annual Leave',
        startDate: '2026-01-28',
        endDate: '2026-01-29',
        actionUrl: '/requests'
      },
      tony.companyId
    );
    console.log('✅ LEAVE_SUBMITTED notification sent\n');
  } catch (error) {
    console.error('❌ Error sending LEAVE_SUBMITTED:', error);
  }
  
  // Test LEAVE_APPROVED notification (this should also create email audit)
  console.log('🧪 Testing LEAVE_APPROVED notification...');
  try {
    await NotificationService.notify(
      tonyId,
      'LEAVE_APPROVED',
      {
        requesterName: `${tony.name} ${tony.lastname}`,
        approverName: 'Test Approver',
        leaveType: 'Annual Leave',
        startDate: '2026-01-28',
        endDate: '2026-01-29',
        actionUrl: '/requests'
      },
      tony.companyId
    );
    console.log('✅ LEAVE_APPROVED notification sent\n');
  } catch (error) {
    console.error('❌ Error sending LEAVE_APPROVED:', error);
  }
  
  // Check email audits after tests
  console.log('📧 Checking email audits after tests...');
  const recentAudits = await prisma.emailAudit.findMany({
    where: { userId: tonyId },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log(`📧 Tony's Email Audits: ${recentAudits.length} found`);
  recentAudits.forEach(audit => {
    console.log(`   ${audit.createdAt.toISOString()} - ${audit.subject}`);
  });
  
  await prisma.$disconnect();
}

testTonyNotifications().catch(console.error);