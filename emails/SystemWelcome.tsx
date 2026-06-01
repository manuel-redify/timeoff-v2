import { Link, Section } from '@react-email/components';
import React from 'react';
import { BaseLayout, sharedStyles } from './components/BaseLayout';

interface SystemWelcomeEmailProps {
  userName: string;
  loginUrl: string;
  logoSrc?: string;
  emailAddress?: string;
  temporaryPassword?: string;
  isProduction?: boolean;
}

export const SystemWelcomeEmail = ({
  userName,
  loginUrl,
  logoSrc,
  emailAddress,
  temporaryPassword,
  isProduction = true,
}: SystemWelcomeEmailProps) => {
  const previewText = `Welcome to TimeOff, ${userName}!`;
  const logoBaseUrl = getBaseUrlFromUrl(loginUrl);
  const signInSummary = isProduction
    ? 'Your account is ready. Sign in with your company Google Workspace account to access TimeOff.'
    : 'Your development account is ready. Use the temporary password below to access TimeOff.';
  const hasTemporaryPassword = Boolean(temporaryPassword);

  return (
    <BaseLayout
      previewText={previewText}
      title="Welcome to TimeOff"
      summary={signInSummary}
      accentTone="success"
      accentIcon="✓"
      logoBaseUrl={logoBaseUrl}
      logoSrc={logoSrc}
      footer={
        <Section style={sharedStyles.footerAction}>
          <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
            <tbody>
              <tr>
                <td align="center">
                  <Link href={loginUrl} style={{ ...sharedStyles.buttonBase, ...sharedStyles.actionButton }}>
                    Log In Now
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      }
    >
      <div style={sharedStyles.detailsLabel}>User</div>
      <div style={sharedStyles.detailsValue}>{userName}</div>

      {emailAddress && (
        <>
          <div style={sharedStyles.detailsLabel}>Email</div>
          <div style={sharedStyles.detailsValue}>{emailAddress}</div>
        </>
      )}

      <div style={sharedStyles.divider} />

      <div style={sharedStyles.detailsLabel}>What You Can Do</div>
      <div style={sharedStyles.secondaryText}>
        Submit leave requests, review approvals, browse the shared calendar, and track your
        remaining allowance from your Redify workspace.
      </div>

      <div style={sharedStyles.detailsLabel}>How To Sign In</div>
      <div style={sharedStyles.secondaryText}>
        {hasTemporaryPassword
          ? 'Use your email address and the temporary password below, then update it after your first login.'
          : 'Use the Sign in with Google option with your company Google Workspace account.'}
      </div>

      {hasTemporaryPassword && (
        <>
          <div style={sharedStyles.detailsLabel}>Temporary Password</div>
          <div style={passwordValue}>{temporaryPassword}</div>
        </>
      )}

      <div style={sharedStyles.detailsLabel}>Login Link</div>
      <div style={sharedStyles.linkValue}>
        <Link href={loginUrl} style={sharedStyles.linkStyle}>
          {loginUrl}
        </Link>
      </div>
    </BaseLayout>
  );
};

export default SystemWelcomeEmail;

function getBaseUrlFromUrl(url: string): string | undefined {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.origin;
  } catch {
    return undefined;
  }
}

const passwordValue = {
  ...sharedStyles.detailsValue,
  fontFamily: "'Courier New', Courier, monospace",
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  padding: '12px 16px',
} as const;
