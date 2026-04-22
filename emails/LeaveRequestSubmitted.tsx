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
      <Body style={main}>
        <div className="container">
          <div className="header">
            <div className="logo">Redify</div>
            <table border={0} cellPadding={0} cellSpacing={0} width="100%">
              <tr>
                <td style={{ width: 60 }} valign="top">
                  <div className="icon-circle">!</div>
                </td>
                <td valign="top">
                  <p className="status-title">Request for Approval</p>
                  <p className="status-msg">
                    A new leave request was submitted and requires your attention. Please review.
                  </p>
                </td>
              </tr>
            </table>
          </div>

          <div className="content-area">
            <div className="details-label">User</div>
            <div className="details-value">
              <a href="#" className="user-link">{requesterName}</a>
            </div>

            <table border={0} cellPadding={0} cellSpacing={0} width="100%">
              <tr>
                <td style={{ width: '50%' }}>
                  <div className="details-label">Start Date</div>
                  <div className="details-value">{startDate}</div>
                </td>
                <td style={{ width: '50%' }}>
                  <div className="details-label">End Date</div>
                  <div className="details-value">{endDate}</div>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="details-label">Leave Type</div>
                  <div className="details-value">{leaveType}</div>
                </td>
                <td>
                  <div className="details-label">Duration</div>
                  <div className="details-value">{duration}</div>
                </td>
              </tr>
            </table>

            <div style={{ borderTop: '1px solid #f0f2f4', margin: '10px 0 25px 0' }} />

            <div className="details-label">User Notes</div>
            <div className="details-value" style={{ fontWeight: 'normal', fontStyle: 'italic' }}>
              "{userNotes}"
            </div>
          </div>

          <div className="footer-action">
            <a href={approveUrl} className="btn btn-approve">
              Approve
            </a>
            <a href={rejectUrl} className="btn btn-reject">
              Reject
            </a>
          </div>
        </div>
        <div className="system-footer">
          Redify PTO System - Automated Notification
        </div>
      </Body>
    </Html>
  );
};

export default LeaveRequestSubmittedEmail;

const main = {
  backgroundColor: '#f2f4f6',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container = {
  maxWidth: '600px',
  margin: '40px auto',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '4px',
  overflow: 'hidden',
};

const header = {
  padding: '40px 48px 30px 48px',
  textAlign: 'center',
};

const logo = {
  fontSize: '28px',
  fontWeight: 'bold',
  fontStyle: 'italic',
  letterSpacing: '-0.5px',
  marginBottom: '30px',
};

const iconCircle = {
  width: '40px',
  height: '40px',
  backgroundColor: '#f39c12',
  borderRadius: '50%',
  display: 'inline-block',
  textAlign: 'center',
  lineHeight: '40px',
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: 'bold',
  marginRight: '20px',
  verticalAlign: 'top',
};

const statusTitle = {
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  lineHeight: '1.2',
  textAlign: 'left',
};

const statusMsg = {
  color: '#6b7c89',
  fontSize: '15px',
  margin: '5px 0 0 0',
  lineHeight: '1.4',
  textAlign: 'left',
};

const contentArea = {
  padding: '30px 48px',
  borderTop: '1px solid #e5e7eb',
};

const detailsLabel = {
  color: '#9aaebc',
  fontSize: '11px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  paddingBottom: '5px',
};

const detailsValue = {
  fontSize: '16px',
  fontWeight: 'bold',
  paddingBottom: '25px',
};

const userLink = {
  color: '#111518',
  textDecoration: 'none',
};

const footerAction = {
  backgroundColor: '#f8f9fa',
  padding: '40px 30px',
  textAlign: 'center',
  borderTop: '1px solid #e5e7eb',
};

const btn = {
  display: 'inline-block',
  padding: '12px 30px',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '14px',
  textDecoration: 'none',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: '0 8px',
  width: '120px',
};

const btnApprove = {
  backgroundColor: '#5cb85c',
  color: '#ffffff',
};

const btnReject = {
  backgroundColor: '#d9534f',
  color: '#ffffff',
};

const systemFooter = {
  textAlign: 'center',
  padding: '30px',
  color: '#9aaebc',
  fontSize: '12px',
};
