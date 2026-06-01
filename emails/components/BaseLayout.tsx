import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import React from 'react';
import { getConfiguredBaseUrl } from '@/lib/app-url';

type AccentTone = 'warning' | 'success' | 'danger' | 'neutral';

interface BaseLayoutProps {
  previewText: string;
  title: string;
  summary: string;
  accentTone?: AccentTone;
  accentIcon?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const accentBackgroundByTone: Record<AccentTone, string> = {
  warning: '#f39c12',
  success: '#5cb85c',
  danger: '#d9534f',
  neutral: '#0f172a',
};

export function BaseLayout({
  previewText,
  title,
  summary,
  accentTone = 'neutral',
  accentIcon = '!',
  children,
  footer,
}: BaseLayoutProps) {
  const appUrl = getConfiguredBaseUrl();
  const logoSrc = `${appUrl}/logo.png`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img src={logoSrc} alt="Redify" style={logo} />
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
                    <div
                      style={{
                        ...iconCircle,
                        backgroundColor: accentBackgroundByTone[accentTone],
                      }}
                    >
                      {accentIcon}
                    </div>
                  </td>
                  <td valign="top">
                    <p style={statusTitle}>{title}</p>
                    <p style={statusMsg}>{summary}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={contentArea}>{children}</Section>

          {footer ?? null}
        </Container>

        <Section style={systemFooter}>
          <Text style={systemFooterText}>Redify PTO System - Automated Notification</Text>
        </Section>
      </Body>
    </Html>
  );
}

export const sharedStyles = {
  footerAction: {
    padding: '40px 30px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e5e7eb',
  },
  buttonBase: {
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
  },
  detailsLabel: {
    paddingBottom: '5px',
    color: '#9aaebc',
    fontSize: '11px',
    lineHeight: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  detailsValue: {
    paddingBottom: '25px',
    color: '#111518',
    fontSize: '16px',
    lineHeight: '20px',
    fontWeight: '700',
  },
  secondaryText: {
    paddingBottom: '25px',
    color: '#111518',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '400',
  },
  italicText: {
    paddingBottom: '25px',
    color: '#111518',
    fontSize: '16px',
    lineHeight: '24px',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  divider: {
    margin: '10px 0 25px 0',
    borderTop: '1px solid #f0f2f4',
  },
  tableColumnLeft: {
    paddingRight: '12px',
  },
  tableColumnRight: {
    paddingLeft: '12px',
  },
  neutralLink: {
    color: '#111518',
    textDecoration: 'none',
  },
  actionButton: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  positiveButton: {
    backgroundColor: '#5cb85c',
    color: '#ffffff',
  },
  negativeButton: {
    backgroundColor: '#d9534f',
    color: '#ffffff',
  },
  linkValue: {
    paddingBottom: '0',
    fontSize: '14px',
    lineHeight: '20px',
    wordBreak: 'break-all',
  },
  linkStyle: {
    color: '#0f172a',
    textDecoration: 'underline',
  },
} as const;

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
  width: '160px',
  height: 'auto',
} as const;

const iconCircle = {
  width: '40px',
  height: '40px',
  borderRadius: '20px',
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
