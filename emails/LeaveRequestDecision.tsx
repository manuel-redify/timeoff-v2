import { Link, Section } from '@react-email/components';
import React from 'react';
import { BaseLayout, sharedStyles } from './components/BaseLayout';

interface LeaveRequestDecisionEmailProps {
  status: 'APPROVED' | 'REJECTED';
  approverName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: string;
  userNotes?: string;
  comment?: string;
  actionUrl?: string;
  requesterName?: string;
}

export const LeaveRequestDecisionEmail = ({
  status,
  approverName,
  leaveType,
  startDate,
  endDate,
  duration,
  userNotes,
  comment,
  actionUrl,
  requesterName,
}: LeaveRequestDecisionEmailProps) => {
  const isApproved = status === 'APPROVED';
  const isWatcher = !!requesterName;
  const previewText = isWatcher
    ? `${requesterName}'s ${leaveType} request has been ${status.toLowerCase()}`
    : `Your ${leaveType} request has been ${status.toLowerCase()}`;
  const headline = isApproved ? 'Leave Request Approved' : 'Leave Request Rejected';
  const summary = isWatcher
    ? `${requesterName}'s ${leaveType} request for ${startDate} - ${endDate} has been ${status.toLowerCase()} by ${approverName}.`
    : `Your ${leaveType} request for ${startDate} - ${endDate} has been ${status.toLowerCase()} by ${approverName}.`;

  return (
    <BaseLayout
      previewText={previewText}
      title={headline}
      summary={summary}
      accentTone={isApproved ? 'success' : 'danger'}
      accentIcon={isApproved ? '✓' : '×'}
      footer={
        actionUrl ? (
          <Section style={sharedStyles.footerAction}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
              <tbody>
                <tr>
                  <td align="center">
                    <Link href={actionUrl} style={{ ...sharedStyles.buttonBase, ...sharedStyles.actionButton }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>
        ) : undefined
      }
    >
      <div style={sharedStyles.detailsLabel}>Approver</div>
      <div style={sharedStyles.detailsValue}>
        <Link href={actionUrl || '#'} style={sharedStyles.neutralLink}>
          {approverName}
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

      {(userNotes || comment) && <div style={sharedStyles.divider} />}

      {userNotes && (
        <>
          <div style={sharedStyles.detailsLabel}>User Notes</div>
          <div style={sharedStyles.italicText}>&quot;{userNotes}&quot;</div>
        </>
      )}

      {comment && (
        <>
          <div style={sharedStyles.detailsLabel}>Supervisor Comment</div>
          <div style={sharedStyles.italicText}>&quot;{comment}&quot;</div>
        </>
      )}
    </BaseLayout>
  );
};

export default LeaveRequestDecisionEmail;
