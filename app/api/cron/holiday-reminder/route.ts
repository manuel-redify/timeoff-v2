import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/smtp2go';
import React from 'react';
import { render } from '@react-email/render';
import HolidayReminderEmail from '@/emails/HolidayReminder';

// This endpoint should be protected by a cron secret in production
export async function GET(req: Request) {
    // Optional: Add authorization header check for cron secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const nextYear = new Date().getFullYear() + 1;
        
        // Fetch all Admins for all companies
        const admins = await prisma.user.findMany({
            where: {
                isAdmin: true,
                deletedAt: null,
                activated: true
            },
            include: {
                company: {
                    select: { name: true }
                }
            }
        });

        if (admins.length === 0) {
            return NextResponse.json({ message: 'No admins found to notify.' });
        }

        let sentCount = 0;

        for (const admin of admins) {
            const subject = `Reminder: Validate Bank Holidays for ${nextYear}`;
            const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://timeoff.yourdomain.com'}/settings/holidays`;
            const htmlBody = await render(
                React.createElement(HolidayReminderEmail, {
                    adminName: admin.name,
                    companyName: admin.company.name,
                    nextYear,
                    reviewUrl,
                })
            );
            const textBody = `Hello ${admin.name},

This is a reminder to review and validate bank holidays for ${nextYear} for ${admin.company.name}.

Review: ${reviewUrl}

This is an automated message.`;

            try {
                await sendEmail(admin.email, subject, htmlBody, textBody);
                sentCount++;
            } catch (err) {
                console.error(`Failed to send holiday reminder to ${admin.email}:`, err);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sent ${sentCount} reminders for year ${nextYear}.` 
        });
    } catch (error) {
        console.error('Cron holiday reminder error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
