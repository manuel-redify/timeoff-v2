import {
  Body,
  Container,
  Head,
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
  duration: string;
  userNotes: string;
  approveUrl: string;
  rejectUrl: string;
}

export const LeaveRequestSubmittedEmail = ({
  requesterName,
  leaveType,
  startDate,
  endDate,
  duration,
  userNotes,
  approveUrl,
  rejectUrl,
}: LeaveRequestSubmittedEmailProps) => {
  const previewText = `New leave request from ${requesterName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>Redify</Text>
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              role="presentation"
            >
              <tbody>
                <tr>
                  <td width="60" valign="top">
                    <div style={iconCircle}>!</div>
                  </td>
                  <td valign="top">
                    <p style={statusTitle}>Request for Approval</p>
                    <p style={statusMsg}>
                      A new leave request was submitted and requires your attention. Please review.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={contentArea}>
            <div style={detailsLabel}>User</div>
            <div style={detailsValue}>
              <Link href={approveUrl} style={userLink}>
                {requesterName}
              </Link>
            </div>

            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              role="presentation"
            >
              <tbody>
                <tr>
                  <td width="50%" valign="top" style={tableColumnLeft}>
                    <div style={detailsLabel}>Start Date</div>
                    <div style={detailsValue}>{startDate}</div>
                  </td>
                  <td width="50%" valign="top" style={tableColumnRight}>
                    <div style={detailsLabel}>End Date</div>
                    <div style={detailsValue}>{endDate}</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" valign="top" style={tableColumnLeft}>
                    <div style={detailsLabel}>Leave Type</div>
                    <div style={detailsValue}>{leaveType}</div>
                  </td>
                  <td width="50%" valign="top" style={tableColumnRight}>
                    <div style={detailsLabel}>Duration</div>
                    <div style={detailsValue}>{duration}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={divider} />

            <div style={detailsLabel}>User Notes</div>
            <div style={userNotesValue}>"{userNotes || '-'}"</div>
          </Section>

          <Section style={footerAction}>
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              border={0}
              role="presentation"
            >
              <tbody>
                <tr>
                  <td align="center">
                    <Link href={approveUrl} style={{ ...buttonBase, ...approveButton }}>
                      Approve
                    </Link>
                    <Link href={rejectUrl} style={{ ...buttonBase, ...rejectButton }}>
                      Reject
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>
        </Container>

        <Section style={systemFooter}>
          <Text style={systemFooterText}>Redify PTO System - Automated Notification</Text>
        </Section>
      </Body>
    </Html>
  );
};

export default LeaveRequestSubmittedEmail;

const body = {
  width: '100%',
  margin: '0',
  padding: '0',
  backgroundColor: '#f2f4f6',
  color: '#111518',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  WebkitTextSizeAdjust: '100%',
  msTextSizeAdjust: '100%',
} as const;

const container = {
  maxWidth: '600px',
  margin: '40px auto',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  overflow: 'hidden',
} as const;

const header = {
  padding: '40px 48px 30px 48px',
  textAlign: 'center',
} as const;

const logo = {
  margin: '0 0 30px 0',
  fontSize: '28px',
  lineHeight: '32px',
  fontWeight: '700',
  fontStyle: 'italic',
  letterSpacing: '-0.5px',
  color: '#111518',
} as const;

const iconCircle = {
  width: '40px',
  height: '40px',
  borderRadius: '20px',
  backgroundColor: '#f39c12',
  color: '#ffffff',
  display: 'inline-block',
  textAlign: 'center',
  lineHeight: '40px',
  fontSize: '20px',
  fontWeight: '700',
  verticalAlign: 'top',
} as const;

const statusTitle = {
  margin: '0',
  padding: '0',
  fontSize: '22px',
  lineHeight: '26px',
  fontWeight: '700',
  textAlign: 'left',
  color: '#111518',
} as const;

const statusMsg = {
  margin: '5px 0 0 0',
  fontSize: '15px',
  lineHeight: '21px',
  textAlign: 'left',
  color: '#6b7c89',
} as const;

const contentArea = {
  padding: '30px 48px',
  borderTop: '1px solid #e5e7eb',
} as const;

const detailsLabel = {
  paddingBottom: '5px',
  color: '#9aaebc',
  fontSize: '11px',
  lineHeight: '14px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '1px',
} as const;

const detailsValue = {
  paddingBottom: '25px',
  color: '#111518',
  fontSize: '16px',
  lineHeight: '20px',
  fontWeight: '700',
} as const;

const userNotesValue = {
  paddingBottom: '0',
  color: '#111518',
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: '400',
  fontStyle: 'italic',
} as const;

const userLink = {
  color: '#111518',
  textDecoration: 'none',
} as const;

const tableColumnLeft = {
  paddingRight: '12px',
} as const;

const tableColumnRight = {
  paddingLeft: '12px',
} as const;

const divider = {
  margin: '10px 0 25px 0',
  borderTop: '1px solid #f0f2f4',
} as const;

const footerAction = {
  padding: '40px 30px',
  textAlign: 'center',
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e5e7eb',
} as const;

const buttonBase = {
  display: 'inline-block',
  width: '120px',
  margin: '0 8px 8px 8px',
  padding: '12px 30px',
  borderRadius: '6px',
  fontSize: '14px',
  lineHeight: '14px',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textDecoration: 'none',
  textAlign: 'center',
  boxSizing: 'border-box',
} as const;

const approveButton = {
  backgroundColor: '#5cb85c',
  color: '#ffffff',
} as const;

const rejectButton = {
  backgroundColor: '#d9534f',
  color: '#ffffff',
} as const;

const systemFooter = {
  padding: '30px',
  textAlign: 'center',
} as const;

const systemFooterText = {
  margin: '0',
  color: '#9aaebc',
  fontSize: '12px',
  lineHeight: '16px',
} as const;
