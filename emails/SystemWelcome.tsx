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

interface SystemWelcomeEmailProps {
  userName: string;
  loginUrl: string;
}

export const SystemWelcomeEmail = ({
  userName,
  loginUrl,
}: SystemWelcomeEmailProps) => {
  const previewText = `Welcome to TimeOff, ${userName}!`;

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
                    <div style={iconCircle}>✓</div>
                  </td>
                  <td valign="top">
                    <p style={statusTitle}>Welcome to TimeOff</p>
                    <p style={statusMsg}>
                      Your account is ready. You can now sign in to manage leave requests, team calendar,
                      and allowance details.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={contentArea}>
            <div style={detailsLabel}>User</div>
            <div style={detailsValue}>{userName}</div>

            <div style={divider} />

            <div style={detailsLabel}>What You Can Do</div>
            <div style={secondaryText}>
              Submit leave requests, review approvals, browse the shared calendar, and track your
              remaining allowance from your Redify workspace.
            </div>

            <div style={detailsLabel}>Login Link</div>
            <div style={linkValue}>
              <Link href={loginUrl} style={linkStyle}>
                {loginUrl}
              </Link>
            </div>
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
                    <Link href={loginUrl} style={{ ...buttonBase, ...loginButton }}>
                      Log In Now
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

export default SystemWelcomeEmail;

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
  backgroundColor: '#5cb85c',
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

const secondaryText = {
  paddingBottom: '25px',
  color: '#111518',
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: '400',
} as const;

const divider = {
  margin: '10px 0 25px 0',
  borderTop: '1px solid #f0f2f4',
} as const;

const linkValue = {
  paddingBottom: '0',
  fontSize: '14px',
  lineHeight: '20px',
  wordBreak: 'break-all',
} as const;

const linkStyle = {
  color: '#0f172a',
  textDecoration: 'underline',
} as const;

const footerAction = {
  padding: '40px 30px',
  textAlign: 'center',
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e5e7eb',
} as const;

const buttonBase = {
  display: 'inline-block',
  width: '160px',
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

const loginButton = {
  backgroundColor: '#0f172a',
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
