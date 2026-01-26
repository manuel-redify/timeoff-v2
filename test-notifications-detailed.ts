import 'dotenv/config';
import prisma from './lib/prisma';

async function testNotificationsDetailed() {
  console.log('=== Detailed Notification Test ===\n');
  
  try {
    const tonyId = 'adf1bcb4-33bc-40de-b2f3-7903e4fe71ea';
    
    // Check Tony's notification preferences
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: tonyId }
    });
    
    console.log(`Tony's notification preferences:`);
    preferences.forEach(pref => {
      console.log(`   ${pref.type}: ${pref.channel}`);
    });
    
    // Check LEAVE_APPROVED preference specifically
    const leaveApprovedPref = await prisma.notificationPreference.findUnique({
      where: {
        userId_type: {
          userId: tonyId,
          type: 'LEAVE_APPROVED'
        }
      }
    });
    
    console.log(`\nLEAVE_APPROVED preference query result:`);
    console.log(`   Found: ${leaveApprovedPref ? 'Yes' : 'No'}`);
    if (leaveApprovedPref) {
      console.log(`   Channel: ${leaveApprovedPref.channel}`);
    }
    
    // Check what channel would be used
    const channel = leaveApprovedPref?.channel || 'BOTH';
    console.log(`\nChannel that would be used: ${channel}`);
    console.log(`Should create in-app notification: ${channel === 'BOTH' || channel === 'IN_APP'}`);
    
    // Try to manually create a notification
    console.log('\n=== Creating notification manually ===');
    
    const testNotification = await prisma.notification.create({
      data: {
        userId: tonyId,
        type: 'LEAVE_APPROVED',
        title: 'Manual Test Notification',
        message: 'This is a manual test notification',
        link: '/requests'
      }
    });
    
    console.log(`✅ Manual notification created: ${testNotification.id}`);
    
    // Verify it was created
    const createdNotification = await prisma.notification.findUnique({
      where: { id: testNotification.id }
    });
    
    if (createdNotification) {
      console.log(`✅ Verification successful - notification exists in database`);
      console.log(`   Created: ${createdNotification.createdAt.toISOString()}`);
    } else {
      console.log(`❌ Verification failed - notification not found`);
    }
    
    // Now check all Tony's notifications
    const allNotifications = await prisma.notification.findMany({
      where: { userId: tonyId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📔 All Tony's notifications (${allNotifications.length} total):`);
    allNotifications.forEach(notif => {
      console.log(`   ${notif.createdAt.toISOString()}: ${notif.type} - ${notif.title}`);
      console.log(`     Message: ${notif.message}`);
      console.log(`     Read: ${notif.isRead ? 'Yes' : 'No'}`);
    });
    
    // Test the notification service again with better debugging
    console.log('\n=== Testing NotificationService with debugging ===');
    
    // Let's manually trace through the notification service logic
    const { NotificationService } = await import('./lib/services/notification.service');
    
    console.log('Calling NotificationService.notify...');
    
    try {
      await NotificationService.notify(
        tonyId,
        'LEAVE_APPROVED',
        {
          requesterName: 'Tony Stark',
          approverName: 'Debug Test',
          leaveType: 'Holiday',
          startDate: '2026-01-26',
          endDate: '2026-01-27',
          comment: 'Debug test notification',
          actionUrl: '/requests'
        },
        'company-debug'
      );
      
      console.log('✅ NotificationService.notify completed without error');
      
      // Check for the notification
      const debugNotification = await prisma.notification.findFirst({
        where: {
          userId: tonyId,
          message: { contains: 'Debug test notification' }
        }
      });
      
      if (debugNotification) {
        console.log('✅ Debug notification created successfully');
        console.log(`   ID: ${debugNotification.id}`);
        console.log(`   Created: ${debugNotification.createdAt.toISOString()}`);
      } else {
        console.log('❌ Debug notification NOT created - investigating further');
        
        // Let's check what preference is actually returned
        const prefCheck = await prisma.notificationPreference.findUnique({
          where: {
            userId_type: {
              userId: tonyId,
              type: 'LEAVE_APPROVED'
            }
          }
        });
        
        console.log(`Preference check result:`, prefCheck);
        
        // Check if the preference query is failing
        const allPrefs = await prisma.notificationPreference.findMany({
          where: { userId: tonyId, type: 'LEAVE_APPROVED' }
        });
        
        console.log(`Alternative preference query result:`, allPrefs);
      }
      
    } catch (error) {
      console.error('❌ Error calling NotificationService.notify:', error);
    }
    
  } catch (error) {
    console.error('❌ Error during detailed test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationsDetailed();
