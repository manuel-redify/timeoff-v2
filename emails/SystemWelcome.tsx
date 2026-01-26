import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import React from 'react';

interface SystemWelcomeEmailProps {
    userName: string;
    loginUrl: string;
}

export const SystemWelcomeEmail = ({
    userName,
    loginUrl,
}: SystemWelcomeEmailProps) => {
    const previewText = `Welcome to TimeOff Management v2, ${userName}!`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Welcome to TimeOff Management</Heading>
                    <Text style={text}>Hi {userName},</Text>
                    <Text style={text}>
                        Your account has been successfully created. You can now log in to manage your leave requests, view the team calendar, and check your remaining allowance.
                    </Text>
                    <Section style={btnContainer}>
                        <Button style={button} href={loginUrl}>
                            Log In Now
                        </Button>
                    </Section>
                    <Text style={text}>
                        If the button above doesn't work, copy and paste this link into your browser:{' '}
                        <Link href={loginUrl} style={link}>
                            {loginUrl}
                        </Link>
                    </Text>
                    <Hr style={hr} />
                    <Text style={footer}>
                        TimeOff Management v2 - Automated Notification
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default SystemWelcomeEmail;

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
};

const h1 = {
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '0 48px',
};

const text = {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left' as const,
    padding: '0 48px',
};

const btnContainer = {
    textAlign: 'center' as const,
    padding: '32px 0 48px',
};

const button = {
    backgroundColor: '#0070f3',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '200px',
    margin: '0 auto',
    padding: '12px 0',
};

const link = {
    color: '#0070f3',
    textDecoration: 'underline',
};

const hr = {
    borderColor: '#e6ebf1',
    margin: '20px 0',
};

const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    padding: '0 48px',
};
