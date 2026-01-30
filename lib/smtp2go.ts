import SMTP2GOApi from 'smtp2go-nodejs';
import { emailConfig } from './email-config';

const smtp2goApiKey = process.env.SMTP2GO_API_KEY;

if (!smtp2goApiKey) {
    console.warn('SMTP2GO_API_KEY is not defined. Email functionality will be disabled.');
}

export const smtp2go = smtp2goApiKey ? SMTP2GOApi(smtp2goApiKey) : null;

interface SendWelcomeEmailParams {
    to: string;
    name: string;
    isProduction: boolean;
    temporaryPassword?: string;
}

export async function sendWelcomeEmail({ to, name, isProduction, temporaryPassword }: SendWelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
    if (!smtp2go) {
        return { success: false, error: 'SMTP2GO not configured' };
    }

    try {
        const subject = 'Welcome to TimeOff Management';
        const html = generateWelcomeEmailHtml(name, to, isProduction, temporaryPassword);

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

function generateWelcomeEmailHtml(name: string, email: string, isProduction: boolean, temporaryPassword?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (isProduction) {
        // Production: Google Login instructions
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to TimeOff Management</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to TimeOff Management</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been created and you're now ready to manage your time off requests!</p>
            <p><strong>How to login:</strong></p>
            <ol>
                <li>Visit our application at <a href="${baseUrl}">${baseUrl}</a></li>
                <li>Click "Sign in with Google"</li>
                <li>Use your company Google Workspace account (${email})</li>
            </ol>
            <p style="text-align: center;">
                <a href="${baseUrl}/login" class="button">Sign In Now</a>
            </p>
            <p><strong>Important:</strong> Please use your company Google account for authentication. Your email address (${email}) is already registered in our system.</p>
            <p>If you have any questions or need assistance, please contact your administrator.</p>
            <p>Best regards,<br>The TimeOff Management Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;
    } else {
        // Development: Temporary password instructions
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to TimeOff Management</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .password-box { background: #e5e7eb; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; font-size: 16px; text-align: center; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to TimeOff Management</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been created in our development environment!</p>
            <p><strong>Your temporary password:</strong></p>
            <div class="password-box">${temporaryPassword || 'TempPassword123!'}</div>
            <p><strong>How to login:</strong></p>
            <ol>
                <li>Visit our application at <a href="${baseUrl}">${baseUrl}</a></li>
                <li>Click "Sign in with Credentials"</li>
                <li>Enter your email: ${email}</li>
                <li>Enter your temporary password (shown above)</li>
                <li>You'll be prompted to change your password after first login</li>
            </ol>
            <p style="text-align: center;">
                <a href="${baseUrl}/login" class="button">Sign In Now</a>
            </p>
            <p><strong>Security Note:</strong> This is a development environment. Please change your password immediately after first login.</p>
            <p>If you have any questions or need assistance, please contact your administrator.</p>
            <p>Best regards,<br>The TimeOff Management Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>`;
    }
}