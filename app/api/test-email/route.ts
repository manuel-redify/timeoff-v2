import { NextResponse } from 'next/server';
import { resend } from '@/lib/resend';

export async function POST() {
    if (!resend) {
        return NextResponse.json(
            { error: 'Resend is not configured' },
            { status: 500 }
        );
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev',
            subject: 'Test Email',
            html: '<p>This is a test email from TimeOff v2</p>',
        });

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
