import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import React from 'react';

interface LeaveRequestDecisionEmailProps {
    status: 'APPROVED' | 'REJECTED';
    approverName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    comment?: string;
    actionUrl?: string;
}

export const LeaveRequestDecisionEmail = ({
    status,
    approverName,
    leaveType,
    startDate,
    endDate,
    comment,
    actionUrl,
}: LeaveRequestDecisionEmailProps) => {
    const isApproved = status === 'APPROVED';
    const previewText = `Your ${leaveType} request has been ${status.toLowerCase()}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={isApproved ? h1Success : h1Danger}>
                        Leave Request {isApproved ? 'Approved' : 'Rejected'}
                    </Heading>
                    <Text style={text}>
                        Your <strong>{leaveType}</strong> request for <strong>{startDate} — {endDate}</strong> has been {status.toLowerCase()} by <strong>{approverName}</strong>.
                    </Text>
                    {comment && (
                        <Section style={commentSection}>
                            <Text style={commentTitle}>Supervisor Comment:</Text>
                            <Text style={commentText}>&ldquo;{comment}&rdquo;</Text>
                        </Section>
                    )}
                    {actionUrl && (
                        <Section style={btnContainer}>
                            <Button style={button} href={actionUrl}>
                                View Details
                            </Button>
                        </Section>
                    )}
                    <Hr style={hr} />
                    <Text style={footer}>
                        TimeOff Management v2 - Automated Notification
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default LeaveRequestDecisionEmail;

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
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '0 48px',
};

const h1Success = {
    ...h1,
    color: '#059669', // Green
};

const h1Danger = {
    ...h1,
    color: '#dc2626', // Red
};

const text = {
    color: '#525f7f',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left' as const,
    padding: '0 48px',
};

const commentSection = {
    margin: '24px 48px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    borderLeft: '4px solid #e5e7eb',
};

const commentTitle = {
    margin: '0',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#374151',
};

const commentText = {
    margin: '8px 0 0',
    fontSize: '14px',
    fontStyle: 'italic',
    color: '#4b5563',
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
