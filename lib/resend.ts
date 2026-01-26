import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
    console.warn('RESEND_API_KEY is not defined. Email functionality will be disabled.');
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;
