# PRD 08: Notifications & Email System

**Document Version:** 1.1
**Date:** January 10, 2026
**Status:** Draft
**Author:** Senior Product Manager (Updated by AI)

---

## 1. Executive Summary

### 1.1 Business Context
The Notifications & Email System is a critical component of TimeOff Management Application v2. It ensures that all stakeholders—employees, supervisors, and administrators—are informed in real-time about leave request status changes, allowance updates, and other relevant system events. Timely notifications reduce communication lag and ensure smooth organizational workflows.

### 1.2 Goals and Objectives
- **Automate Communication:** Eliminate manual follow-ups by triggering automated emails and in-app alerts.
- **Support Workflows:** Provide immediate feedback for approval processes.
- **Customizable Experience:** Enable users to manage their notification preferences.
- **Auditability:** Maintain a record of all communications sent via the system.

### 1.3 Success Criteria
- 100% reliability in delivering workflow-critical notifications (approvals, rejections).
- Support for both email and in-app notification channels.
- Scalable architecture using Supabase Edge Functions for email delivery.
- User-friendly email templates with clear calls to action.

---

## 2. Functional Requirements

### 2.1 Email Notifications
The system must generate and send emails for the following triggers:

| Trigger Event | Recipient(s) | Content Summary |
|---|---|---|
| **Leave Request Submitted** | Supervisor(s), Watchers | New request details, link to approval page. |
| **Leave Request Submitted** | Employee (Requester) | Confirmation of submission. Mentions if it is waiting for approval or auto-approved (e.g., for Contractors). |
| **Leave Request Approved** | Employee, Watchers | Confirmation of approval, updated allowance notice. |
| **Leave Request Rejected** | Employee | Rejection notice, supervisor comment included. |
| **Leave Request Cancelled** | Supervisor(s) | Notification that a pending request was withdrawn. |
| **Leave Request Revoked** | Employee | Notification that an approved request was cancelled by an admin. |
| **System Welcome** | New User | Account activation link, initial setup instructions. |

### 2.2 In-App Notifications
- **Notification Center:** A dedicated UI component (shadcn/ui popover or similar) displaying recent alerts.
- **Read/Unread Status:** Users can mark notifications as read or clear them individually/bulk.
- **Real-time Updates:** Utilize Supabase Realtime to update the notification counter without page refreshes.

### 2.3 User Preferences
- Users can toggle between "Email Only", "In-App Only", or "Both" for specific notification types.
- **Global Opt-out:** Users can disable non-critical notifications (e.g., weekly summaries).
- **Mandatory Notifications:** Critical workflow updates (approvals/rejections) cannot be fully disabled.

### 2.4 Watcher System
- Based on `watcher_rules` defined in PRD 12.
- Notifications sent to non-approving stakeholders who need visibility (e.g., HR, secondary managers).

---

## 3. Technical Specifications

### 3.1 Data Model Integration
This PRD utilizes the following tables defined in **PRD 12**:

- **`email_audit`:** Records individual emails sent, including recipient, template, and status.
- **`watcher_rules`:** Defines who should be notified for specific events.
- **`user_feeds`:** Supports in-app notification streams.
- **`comments`:** Source for comments included in rejection/approval notifications.

### 3.2 Email Infrastructure
- **Service:** Supabase Edge Functions utilizing an SMTP provider (e.g., Resend, SendGrid, or AWS SES).
- **Template Engine:** React Email or similar for responsive, maintainable HTML templates.
- **Queueing:** Leverage Supabase PG_NET or Edge Function retries for reliable delivery.

### 3.3 API Endpoints
- `GET /api/notifications`: Fetch user's notification feed.
- `PATCH /api/notifications/:id`: Mark notification as read.
- `PUT /api/user/preferences/notifications`: Update notification settings.

---

## 4. User Experience

### 4.1 Email Design
- **Header:** Company branding/logo.
- **Body:** Clear description of the event (e.g., "John Doe has submitted a vacation request").
- **CTA:** "View Request" or "Approve/Reject" buttons linking directly to the relevant dashboard page.

### 4.2 In-App Component
- **Badge:** A red dot/counter on the bell icon in the navigation bar.
- **List:** A scrollable list of recent events with timestamps.
- **Empty State:** "You're all caught up!" message.

---

## 5. Implementation Notes

### 5.1 Security & Compliance
- **Data Privacy:** Do not include sensitive PII in email subject lines.
- **Auth:** Ensure links in emails require authentication before showing sensitive data.
- **Rate Limiting:** Prevent notification spamming during high-frequency actions.

### 5.2 Performance
- Notification generation should be asynchronous (background task) to avoid slowing down the main request/response cycle.

---

## 6. Testing Requirements

### 6.1 Test Scenarios
- **Scenario 1:** Submit a leave request and verify the supervisor receives an email and in-app alert.
- **Scenario 2:** Verify that watchers defined in `watcher_rules` receive notifications.
- **Scenario 3:** Update notification preferences and confirm the system respects the new settings.
- **Scenario 4:** Verify that an email is logged in `email_audit` upon successful delivery.

### 6.2 Edge Cases
- Handling email bounces/delivery failures.
- Notifications for requests involving half-days.
- Multiple supervisors receiving and interacting with the same notification.

---

## 7. Dependencies & References

- **PRD 01:** User Management (for preferences and profile data).
- **PRD 04:** Leave Workflow (triggers for notifications).
- **PRD 07:** Approval Management (supervisor-specific alerts).
- **PRD 12:** Database Schema (table structures).

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------------|------------|-----------------------------------------------------------------------|
| 1.0     | 2026-01-10 | Senior PM  | Initial draft created for Timeoff V2.                                 |
| 1.1     | 2026-01-10 | AI Assistant | Added missing Employee notification for Leave Request submission. |
