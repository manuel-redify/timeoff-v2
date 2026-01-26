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

interface LeaveRequestSubmittedEmailProps {
    requesterName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    actionUrl: string;
}

export const LeaveRequestSubmittedEmail = ({
    requesterName,
    leaveType,
    startDate,
    endDate,
    actionUrl,
}: LeaveRequestSubmittedEmailProps) => {
    const previewText = `New leave request from ${requesterName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>New Leave Request</Heading>
                    <Text style={text}>
                        <strong>{requesterName}</strong> has submitted a new <strong>{leaveType}</strong> request.
                    </Text>
                    <Section style={detailsSection}>
                        <Text style={detailsText}>
                            <strong>Dates:</strong> {startDate} — {endDate}
                        </Text>
                    </Section>
                    <Section style={btnContainer}>
                        <Button style={button} href={actionUrl}>
                            Review Request
                        </Button>
                    </Section>
                    <Text style={text}>
                        Alternatively, you can copy and paste this URL into your browser:{' '}
                        <Link href={actionUrl} style={link}>
                            {actionUrl}
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

export default LeaveRequestSubmittedEmail;

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

const detailsSection = {
    padding: '0 48px',
};

const detailsText = {
    ...text,
    padding: '0',
    color: '#525f7f',
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
