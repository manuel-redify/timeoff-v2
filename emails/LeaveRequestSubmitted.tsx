import { Link, Section } from '@react-email/components';
import React from 'react';
import { BaseLayout, sharedStyles } from './components/BaseLayout';

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
    <BaseLayout
      previewText={previewText}
      title="Request for Approval"
      summary="A new leave request was submitted and requires your attention. Please review."
      accentTone="warning"
      accentIcon="!"
      footer={
        <Section style={sharedStyles.footerAction}>
          <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
            <tbody>
              <tr>
                <td align="center">
                  <Link href={approveUrl} style={{ ...buttonBase, ...sharedStyles.positiveButton }}>
                    Approve
                  </Link>
                  <Link href={rejectUrl} style={{ ...buttonBase, ...sharedStyles.negativeButton }}>
                    Reject
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      }
    >
      <div style={sharedStyles.detailsLabel}>User</div>
      <div style={sharedStyles.detailsValue}>
        <Link href={approveUrl} style={sharedStyles.neutralLink}>
          {requesterName}
        </Link>
      </div>

      <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
        <tbody>
          <tr>
            <td width="50%" valign="top" style={sharedStyles.tableColumnLeft}>
              <div style={sharedStyles.detailsLabel}>Start Date</div>
              <div style={sharedStyles.detailsValue}>{startDate}</div>
            </td>
            <td width="50%" valign="top" style={sharedStyles.tableColumnRight}>
              <div style={sharedStyles.detailsLabel}>End Date</div>
              <div style={sharedStyles.detailsValue}>{endDate}</div>
            </td>
          </tr>
          <tr>
            <td width="50%" valign="top" style={sharedStyles.tableColumnLeft}>
              <div style={sharedStyles.detailsLabel}>Leave Type</div>
              <div style={sharedStyles.detailsValue}>{leaveType}</div>
            </td>
            <td width="50%" valign="top" style={sharedStyles.tableColumnRight}>
              <div style={sharedStyles.detailsLabel}>Duration</div>
              <div style={sharedStyles.detailsValue}>{duration}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={sharedStyles.divider} />

      <div style={sharedStyles.detailsLabel}>User Notes</div>
      <div style={userNotesValue}>&quot;{userNotes || '-'}&quot;</div>
    </BaseLayout>
  );
};

export default LeaveRequestSubmittedEmail;

const buttonBase = {
  ...sharedStyles.buttonBase,
  width: '120px',
} as const;

const userNotesValue = {
  paddingBottom: '0',
  color: '#111518',
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: '400',
  fontStyle: 'italic',
} as const;
