import { NextResponse } from 'next/server';
import { smtp2go } from '@/lib/smtp2go';
import { emailConfig } from '@/lib/email-config';

export async function POST() {
if (!smtp2go) {
        return NextResponse.json(
            { error: 'SMTP2GO is not configured' },
            { status: 500 }
        );
    }

    try {
        const mailService = smtp2go.mail()
            .to({ email: 'delivered@resend.dev' })
            .from({ email: emailConfig.sender.email, name: emailConfig.sender.name })
            .subject('Test Email')
            .html('<p>This is a test email from TimeOff v2</p>');

        const { data, error } = await smtp2go.client().consume(mailService);

        if (error) {
            return NextResponse.json({ error }, { status: 400 });
        }

        return NextResponse.json({ data });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
