import SMTP2GOApi from 'smtp2go-nodejs';
import React from 'react';
import { render } from '@react-email/render';
import SystemWelcomeEmail from '@/emails/SystemWelcome';
import { emailConfig } from './email-config';

const smtp2goApiKey = process.env.SMTP2GO_API_KEY;

if (!smtp2goApiKey) {
    console.warn('SMTP2GO_API_KEY is not defined. Email functionality will be disabled.');
}

export const smtp2go = smtp2goApiKey ? SMTP2GOApi(smtp2goApiKey) : null;

interface SendWelcomeEmailParams {
    to: string;
    name: string;
    lastname: string;
    isProduction: boolean;
    temporaryPassword?: string;
}

export async function sendEmail(to: string, subject: string, htmlBody: string, textBody: string): Promise<{ success: boolean; error?: string }> {
    if (!smtp2go) {
        return { success: false, error: 'SMTP2GO not configured' };
    }

    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        if (smtp2goApiKey) {
            headers['X-Smtp2go-Api-Key'] = smtp2goApiKey;
        }

        const fetchResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                to: [to],
                sender: `${emailConfig.sender.name} <${emailConfig.sender.email}>`,
                subject: subject,
                html_body: htmlBody,
                text_body: textBody,
            }),
        });

        const response = await fetchResponse.json();

        if (response.data?.succeeded > 0 || response.data?.succeeded?.length > 0) {
            return { success: true };
        } else {
            const errorMsg = response.data?.error?.message || response.data?.failures?.[0] || response.error || 'Email sending failed';
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function sendWelcomeEmail({ to, name, lastname, isProduction, temporaryPassword }: SendWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
    if (!smtp2go) {
        return { success: false, error: 'SMTP2GO not configured' };
    }

    try {
        const subject = 'Welcome to TimeOff Management';
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const html = await render(
            React.createElement(SystemWelcomeEmail, {
                userName: `${name} ${lastname}`.trim(),
                loginUrl: `${baseUrl}/login`,
                emailAddress: to,
                temporaryPassword,
                isProduction,
            })
        );
        const textBody = generateWelcomeEmailText(name, to, baseUrl, isProduction, temporaryPassword);

        // Basic HTTP request approach since API structure is unclear
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        
        if (smtp2goApiKey) {
            headers['X-Smtp2go-Api-Key'] = smtp2goApiKey;
        }

        const fetchResponse = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                to: [to],
                sender: `${emailConfig.sender.name} <${emailConfig.sender.email}>`,
                subject: subject,
                html_body: html,
                text_body: textBody,
            }),
        });

        const response = await fetchResponse.json();
        console.log('SMTP2GO Response:', JSON.stringify(response, null, 2));
        console.log('SMTP2GO succeeded count:', response.data?.succeeded);
        console.log('SMTP2GO succeeded length:', response.data?.succeeded?.length);

        // Check if email was sent successfully
        if (response.data?.succeeded > 0) {
            console.log('Email sent successfully - returning success: true');
            return { success: true };
        } else if (response.data?.succeeded?.length > 0) {
            console.log('Email sent successfully (array) - returning success: true');
            return { success: true };
        } else {
            const errorMsg = response.data?.error?.message || response.data?.failures?.[0] || response.error || 'Email sending failed';
            console.log('Email failed - error:', errorMsg);
            return { success: false, error: errorMsg };
        }
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

function generateWelcomeEmailText(
    name: string,
    email: string,
    baseUrl: string,
    isProduction: boolean,
    temporaryPassword?: string
): string {
    if (isProduction) {
        return `Hi ${name},

Welcome to TimeOff Management.

Your account is ready. Sign in with Google using your company Google Workspace account (${email}).

Login: ${baseUrl}/login

This is an automated message.`;
    } else {
        return `Hi ${name},

Welcome to TimeOff Management.

Your development account is ready.
Email: ${email}
Temporary password: ${temporaryPassword || 'TempPassword123!'}

Login: ${baseUrl}/login

Please change your password after your first login.

This is an automated message.`;
    }
}
