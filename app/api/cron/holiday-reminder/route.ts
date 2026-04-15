import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/smtp2go';

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
            const htmlBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #4f46e5;">TimeOff Management</h2>
                    <p>Hello ${admin.name},</p>
                    <p>This is an automated reminder from your TimeOff Management system.</p>
                    <p>The year <strong>${nextYear}</strong> is approaching. Please ensure you review and validate the Bank Holidays for your company (${admin.company.name}) across all active countries.</p>
                    <p>Validating bank holidays ensures that employees' time-off requests are calculated accurately without deducting leave balances on public holidays.</p>
                    <br/>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://timeoff.yourdomain.com'}/settings/holidays" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Holidays Now</a>
                    <br/><br/>
                    <p>Best regards,<br/>TimeOff Management System</p>
                </div>
            `;
            const textBody = `Hello ${admin.name},\n\nThis is a reminder to review and validate Bank Holidays for ${nextYear} in the TimeOff Management system.\n\nPlease visit your dashboard settings to complete this action.`;

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
