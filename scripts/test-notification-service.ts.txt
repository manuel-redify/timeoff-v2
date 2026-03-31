#!/usr/bin/env tsx

import { NotificationService } from '../lib/services/notification.service';
import prisma from '../lib/prisma';

async function testNotificationService() {
    console.log('🧪 Testing NotificationService...\n');

    try {
        // Test 1: Check if we can find a test user
        const testUser = await prisma.user.findFirst({
            select: { id: true, email: true, name: true, companyId: true }
        });

        if (!testUser) {
            console.log('❌ No test user found in database');
            return;
        }

        console.log(`✅ Found test user: ${testUser.name} (${testUser.email})\n`);

        // Test 2: Test LEAVE_SUBMITTED notification
        console.log('📧 Testing LEAVE_SUBMITTED notification...');
        await NotificationService.notify(
            testUser.id,
            'LEAVE_SUBMITTED',
            {
                requesterName: 'John Doe',
                leaveType: 'Annual Leave',
                startDate: '2026-02-01',
                endDate: '2026-02-03',
                actionUrl: 'https://example.com/leave/123'
            },
            testUser.companyId || undefined
        );
        console.log('✅ LEAVE_SUBMITTED notification sent\n');

        // Test 3: Test WELCOME notification
        console.log('🎉 Testing WELCOME notification...');
        await NotificationService.notify(
            testUser.id,
            'WELCOME',
            {
                userName: testUser.name || 'User',
                loginUrl: 'https://example.com/login'
            },
            testUser.companyId || undefined
        );
        console.log('✅ WELCOME notification sent\n');

        // Test 4: Check if notifications were created
        const notifications = await prisma.notification.findMany({
            where: { userId: testUser.id },
            orderBy: { createdAt: 'desc' },
            take: 2
        });

        console.log(`📋 Found ${notifications.length} recent notifications:`);
        notifications.forEach(notif => {
            console.log(`  - ${notif.type}: ${notif.title}`);
        });

        // Test 5: Check if email audits were created (if emails were sent)
        const emailAudits = await prisma.emailAudit.findMany({
            where: { userId: testUser.id },
            orderBy: { createdAt: 'desc' },
            take: 2
        });

        if (emailAudits.length > 0) {
            console.log(`\n📧 Found ${emailAudits.length} recent email audits:`);
            emailAudits.forEach(audit => {
                console.log(`  - ${audit.subject} to ${audit.email}`);
            });
        } else {
            console.log('\n📧 No email audits found (emails may not be configured)');
        }

        console.log('\n✅ NotificationService test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testNotificationService();