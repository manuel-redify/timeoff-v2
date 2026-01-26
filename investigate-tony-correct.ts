import 'dotenv/config';
import prisma from './lib/prisma';

async function investigateTonyNotifications() {
  const tonyId = 'adf1bcb4-33bc-40de-b2f3-7903e4fe71ea'; // Correct Tony Stark ID
  
  console.log('=== Tony Stark Notification Investigation ===\n');
  
  try {
    // Get Tony's user info
    const tony = await prisma.user.findUnique({
      where: { id: tonyId },
      include: { 
        company: true,
        notificationPreferences: true
      }
    });
    
    if (!tony) {
      console.log('❌ Tony Stark not found in database');
      return;
    }
    
    console.log(`✅ Found Tony Stark: ${tony.name} ${tony.lastname} (${tony.email})`);
    console.log(`🏢 Company: ${tony.company.name} (Mode: ${tony.company.mode})`);
    console.log(`👤 Is Admin: ${tony.isAdmin}`);
    console.log(`📧 Email: ${tony.email}`);
    console.log(`🔄 Clerk ID: ${tony.clerkId}`);
    
    // Check notification preferences
    console.log(`\n📊 Notification Preferences (${tony.notificationPreferences.length} found):`);
    if (tony.notificationPreferences.length === 0) {
      console.log('   No explicit preferences found - will use defaults:');
      console.log('   LEAVE_SUBMITTED -> BOTH');
      console.log('   LEAVE_APPROVED -> EMAIL');
      console.log('   LEAVE_REJECTED -> EMAIL');
      console.log('   WELCOME -> EMAIL');
    } else {
      tony.notificationPreferences.forEach(pref => {
        console.log(`   ${pref.type}: ${pref.channel}`);
      });
    }
    
    // Check recent notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: tonyId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log(`\n🔔 Recent Notifications (${notifications.length} found):`);
    if (notifications.length === 0) {
      console.log('   No notifications found in database');
    } else {
      notifications.forEach(notif => {
        console.log(`   ${notif.createdAt.toISOString()} ${notif.type}: ${notif.title}`);
        console.log(`     Status: ${notif.isRead ? 'READ' : 'UNREAD'}`);
        console.log(`     Message: ${notif.message}`);
        if (notif.link) console.log(`     Link: ${notif.link}`);
        console.log('');
      });
    }
    
    // Check email audits
    const emailAudits = await prisma.emailAudit.findMany({
      where: { userId: tonyId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📧 Email Audits (${emailAudits.length} found):`);
    if (emailAudits.length === 0) {
      console.log('   No email audits found');
    } else {
      emailAudits.forEach(audit => {
        console.log(`   ${audit.createdAt.toISOString()} ${audit.subject}`);
        console.log(`     To: ${audit.email}`);
        console.log(`     Company ID: ${audit.companyId}`);
        console.log('');
      });
    }
    
    // Check recent leave requests and their status
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: { userId: tonyId },
      include: { 
        leaveType: true,
        approver: {
          select: { name: true, lastname: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📅 Recent Leave Requests (${leaveRequests.length} found):`);
    if (leaveRequests.length === 0) {
      console.log('   No leave requests found');
    } else {
      leaveRequests.forEach(req => {
        console.log(`   ${req.createdAt.toISOString()} ${req.leaveType.name}: ${req.status}`);
        console.log(`     Period: ${req.dateStart.toISOString().split('T')[0]} to ${req.dateEnd.toISOString().split('T')[0]}`);
        if (req.approverId && req.approver) {
          console.log(`     Approved by: ${req.approver.name} ${req.approver.lastname} (${req.approver.email})`);
        }
        if (req.approverComment) {
          console.log(`     Comment: ${req.approverComment}`);
        }
        if (req.decidedAt) {
          console.log(`     Decided at: ${req.decidedAt.toISOString()}`);
        }
        console.log('');
      });
    }
    
    // Check if RESEND_API_KEY is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    console.log(`\n🔑 Email Configuration:`);
    console.log(`   RESEND_API_KEY configured: ${resendApiKey ? 'Yes' : 'No'}`);
    if (!resendApiKey) {
      console.log('   ⚠️  Email notifications will not work without RESEND_API_KEY');
    }
    
    // Test notification service directly for Tony
    console.log(`\n🧪 Testing Notification Service for Tony...`);
    const { NotificationService } = await import('./lib/services/notification.service');
    
    try {
      await NotificationService.notify(
        tonyId,
        'LEAVE_APPROVED',
        {
          requesterName: `${tony.name} ${tony.lastname}`,
          approverName: 'Test Approver',
          leaveType: 'Annual Leave',
          startDate: '2026-01-26',
          endDate: '2026-01-27',
          comment: 'Test notification for debugging',
          actionUrl: `/requests`
        },
        tony.companyId
      );
      console.log('✅ Test notification sent successfully');
      
      // Check if notification was created
      const testNotification = await prisma.notification.findFirst({
        where: { 
          userId: tonyId,
          type: 'LEAVE_APPROVED',
          message: { contains: 'Test notification for debugging' }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (testNotification) {
        console.log('✅ In-app notification created successfully');
      } else {
        console.log('❌ In-app notification NOT created');
      }
      
      // Check if email audit was created
      const testEmailAudit = await prisma.emailAudit.findFirst({
        where: { 
          userId: tonyId,
          subject: { contains: 'Leave Request Approved' }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (testEmailAudit) {
        console.log('✅ Email audit created successfully');
      } else {
        console.log('❌ Email audit NOT created');
      }
      
    } catch (error) {
      console.error('❌ Error testing notification service:', error);
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateTonyNotifications();
