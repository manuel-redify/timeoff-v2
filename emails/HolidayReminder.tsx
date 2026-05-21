import { Link, Section } from '@react-email/components';
import React from 'react';
import { BaseLayout, sharedStyles } from './components/BaseLayout';

interface HolidayReminderEmailProps {
  adminName: string;
  companyName: string;
  nextYear: number;
  reviewUrl: string;
}

export const HolidayReminderEmail = ({
  adminName,
  companyName,
  nextYear,
  reviewUrl,
}: HolidayReminderEmailProps) => {
  const previewText = `Reminder to validate bank holidays for ${nextYear}`;

  return (
    <BaseLayout
      previewText={previewText}
      title="Bank Holiday Review Reminder"
      summary={`The year ${nextYear} is approaching. Please review and validate bank holidays for ${companyName}.`}
      accentTone="warning"
      accentIcon="!"
      footer={
        <Section style={sharedStyles.footerAction}>
          <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
            <tbody>
              <tr>
                <td align="center">
                  <Link href={reviewUrl} style={{ ...sharedStyles.buttonBase, ...sharedStyles.actionButton }}>
                    Review Holidays
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      }
    >
      <div style={sharedStyles.detailsLabel}>Admin</div>
      <div style={sharedStyles.detailsValue}>{adminName}</div>

      <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
        <tbody>
          <tr>
            <td width="50%" valign="top" style={sharedStyles.tableColumnLeft}>
              <div style={sharedStyles.detailsLabel}>Company</div>
              <div style={sharedStyles.detailsValue}>{companyName}</div>
            </td>
            <td width="50%" valign="top" style={sharedStyles.tableColumnRight}>
              <div style={sharedStyles.detailsLabel}>Year</div>
              <div style={sharedStyles.detailsValue}>{nextYear}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={sharedStyles.divider} />

      <div style={sharedStyles.detailsLabel}>Why It Matters</div>
      <div style={sharedStyles.secondaryText}>
        Validated bank holidays keep leave balances and absence calculations accurate across all
        active countries in your company.
      </div>

      <div style={sharedStyles.detailsLabel}>Review Link</div>
      <div style={sharedStyles.linkValue}>
        <Link href={reviewUrl} style={sharedStyles.linkStyle}>
          {reviewUrl}
        </Link>
      </div>
    </BaseLayout>
  );
};

export default HolidayReminderEmail;
