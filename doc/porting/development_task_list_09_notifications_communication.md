# Phase 9: Notifications & Communication - Task List

## Overview
This phase implements the automated communication hub of the application. It ensures all stakeholders are kept informed via email and in-app alerts as leave requests move through their lifecycle. It also includes a robust preference system for users and a watcher mechanism for indirect stakeholders.

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Phase 4 (Leave Type Configuration) completed.
- [ ] Phase 6 (Leave Request Workflow) completed.
- [ ] Phase 7 (Approval & Supervisor Dashboard) completed.
- [ ] Read and understood [PRD 08: Notifications & Email System](file:///prd/porting_prd/prd_08_notifications_and_email_system.md).

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Email Infrastructure Setup**: Configure the email delivery service (e.g., Resend).
  - **Done looks like**: Test emails can be sent successfully from the backend.
- [ ] **Email Template Development**: Create responsive HTML templates using React Email for all primary triggers (Submission, Approval, Rejection, etc.).
  - **Done looks like**: Professional-looking templates with clear CTAs are ready for all events.
- [ ] **Notification Event Bus**: Implement an internal service to trigger notifications asynchronously across the application.
  - **Done looks like**: Calling a single `notify()` function triggers both email and in-app alerts based on preferences.
- [ ] **In-App Notification API**: Implement `GET /api/notifications` and `PATCH /api/notifications/:id` for the notification center.
  - **Done looks like**: Users can retrieve their personal alerts and mark them as read.
- [ ] **Preference Management API**: Implement `PUT /api/user/preferences/notifications`.
  - **Done looks like**: Users can save their preferred channels (Email/In-App) for different event types.

### 2. UI & Frontend
- [ ] **Notification Center Component**: Build the navigation bar popover or drawer showing recent alerts.
  - **Done looks like**: Real-time badge counter and a scrollable list of recent notifications with timestamps.
- [ ] **User Preferences UI**: Build the notification settings section in the User Profile.
  - **Done looks like**: Interactive toggles for configuring which events trigger which channel.
- [ ] **Real-time Integration**: Connect the UI to Supabase Realtime to update the notification badge instantly.
  - **Done looks like**: Counters increment immediately when a new request or decision is made.

### 3. Integration & Glue Code
- [ ] **Workflow Hook Integration**: Insert notification triggers into the Leave Request and Approval action endpoints.
  - **Done looks like**: Submitting/approving/rejecting a request automatically fires off the relevant alerts.
- [ ] **Watcher Logic Implementation**: Integrate `watcher_rules` into the notification service to include HR/Managers in relevant updates.
  - **Done looks like**: Stakeholders defined in watcher rules receive the same visibility as supervisors.
- [ ] **Audit Trail Integration**: Ensure every sent email is recorded in the `email_audit` table.
  - **Done looks like**: Admins can track exactly what communication was sent to whom and when.

## Acceptance Criteria
- [ ] All 7+ critical workflow triggers correctly fire automated emails and in-app alerts.
- [ ] In-app notification badge updates in real-time via Supabase Realtime.
- [ ] Users can successfully customize their notification channels via their profile settings.
- [ ] All sent emails are logged in the audit table for history and debugging.
- [ ] Emails are responsive and look consistent across major clients (Gmail, Outlook).

## Testing & Validation Checklist
- [ ] Integration tests for the notification event bus (verifying multiple channel delivery).
- [ ] Manual verification of email appearance in a test inbox (checking layout and links).
- [ ] Manual test of preferences (e.g., disable Email and verify only In-App alert is received).
- [ ] Manual smoke test of real-time badge updates (submit request from another account).
- [ ] Mobile responsiveness check for the in-app notification center.
