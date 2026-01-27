import SMTP2GOApi from 'smtp2go-nodejs';

const smtp2goApiKey = process.env.SMTP2GO_API_KEY;

if (!smtp2goApiKey) {
    console.warn('SMTP2GO_API_KEY is not defined. Email functionality will be disabled.');
}

export const smtp2go = smtp2goApiKey ? SMTP2GOApi(smtp2goApiKey) : null;