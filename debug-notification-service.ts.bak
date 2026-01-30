import 'dotenv/config';
import prisma from './lib/prisma';

async function debugNotificationService() {
  console.log('=== Debug NotificationService Internals ===\n');
  
  try {
    const tonyId = 'adf1bcb4-33bc-40de-b2f3-7903e4fe71ea';
    
    // Manually replicate the NotificationService logic
    console.log('1. Fetching user preferences...');
    const preference = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId: tonyId,
          type: 'LEAVE_APPROVED'
        }
      }
    });
    
    console.log('Preference found:', preference);
    
    const channel = preference?.channel || 'BOTH';
    console.log(`Channel determined: ${channel}`);
    
    if (channel === 'NONE') {
      console.log('Channel is NONE, returning early');
      return;
    }
    
    // 2. Prepare content/meta
    let title = '';
    let message = '';
    let link = '/requests';
    
    const type = 'LEAVE_APPROVED';
    
    switch (type) {
      case 'LEAVE_APPROVED':
        title = 'Leave Request Approved';
        message = `Your Debug request for 2026-01-26 has been approved.`;
        break;
    }
    
    console.log(`Content prepared:`);
    console.log(`   Title: ${title}`);
    console.log(`   Message: ${message}`);
    console.log(`   Link: ${link}`);
    
    // 3. Dispatch In-App Notification
    console.log(`\n3. Should dispatch in-app notification: ${channel === 'BOTH' || channel === 'IN_APP'}`);
    
    if (channel === 'BOTH' || channel === 'IN_APP') {
      try {
        console.log('Creating notification in database...');
        
        const notificationData = {
          userId: tonyId,
          type,
          title,
          message,
          link,
        };
        
        console.log('Notification data:', notificationData);
        
        const createdNotification = await prisma.notification.create({
          data: notificationData,
        });
        
        console.log('✅ Notification created successfully:', createdNotification.id);
        
      } catch (err) {
        console.error('❌ Failed to create in-app notification:', err);
      }
    }
    
    // 4. Dispatch Email Notification
    console.log(`\n4. Should dispatch email: ${(channel === 'BOTH' || channel === 'EMAIL')} && resend exists`);
    
    if ((channel === 'BOTH' || channel === 'EMAIL')) {
      console.log('Checking resend configuration...');
      const { resend } = await import('./lib/resend');
      console.log(`Resend available: ${!!resend}`);
      
      if (resend) {
        console.log('Email would be sent here...');
      } else {
        console.log('Email skipped - resend not configured');
      }
    }
    
    // Now let's check what actually happened
    console.log('\n=== Checking Results ===');
    
    const finalNotifications = await prisma.notification.findMany({
      where: { userId: tonyId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    console.log(`Tony's recent notifications (${finalNotifications.length}):`);
    finalNotifications.forEach(notif => {
      console.log(`   ${notif.createdAt.toISOString()}: ${notif.type} - ${notif.title}`);
      console.log(`     Message: ${notif.message.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNotificationService();
