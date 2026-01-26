# PRD Analysis - Notifications & Communication
**Version:** v1
**Date:** 2026-01-25

## 🎯 Objective
Implement an automated communication hub for TimeOff Management v2, ensuring timely information delivery via email and in-app alerts for all stakeholders during leave request lifecycles, with customizable user preferences and auditability, built on the project's Next.js/Neon/Prisma stack.

## 📋 Functional Requirements
1. **Email Notifications**: Triggered on:
    - Leave Request Submitted (Supervisor, Watchers, Employee)
    - Leave Request Approved/Rejected/Cancelled/Revoked (Employee, Watchers, Supervisor)
    - System Welcome (New User)
2. **In-App Notifications**:
    - Dedicated UI component (popover/drawer)
    - Read/Unread status management
    - UI updates via state management or polling (Supabase Realtime excluded)
3. **User Preferences**:
    - Toggle between Email/In-App/Both per event type
    - Global opt-out for non-critical notifications
    - Mandatory status for critical workflow alerts
4. **Watcher System**:
    - Automatic notification of non-approving stakeholders based on `watcher_rules`
5. **Audit Trail**:
    - Log every sent email in `email_audit` table

## 🔧 Technical Requirements
- **Stack**: Next.js (API Routes), Prisma, Neon (PostgreSQL), React Email, shadcn/ui
- **Infrastructure**: SMTP provider (Resend) - Integrated via SDK/API
- **Data Model**: Integrates with `email_audit`, `watcher_rules`, `user_feeds`, and `comments` tables (from PRD 12)
- **API Endpoints**: 
    - `GET /api/notifications`
    - `PATCH /api/notifications/:id`
    - `PUT /api/user/preferences/notifications`
- **Performance**: Asynchronous notification generation (background tasks)

## 🚫 Out of Scope
- Weekly summaries (mentioned as non-critical but not explicitly in functional triggers table)
- Push notifications (mobile app style)
- SMS notifications

## ❓ Clarifications Needed
1. **Email Service**: Confirmed Resend as the primary provider.
2. **In-App Storage**: Confirming use of a new `Notification` table in Neon instead of `user_feeds` (which seems to be for another purpose).
3. **Internal Triggers**: Since there are no Edge Functions, triggers will be integrated directly into the Business Logic services (e.g., `LeaveRequestService`).
4. **Resend Key**: Assuming I'll need to set up the environment variable in `.env.local`.

## 🔗 Dependencies
- **Blocking**:
    - DB tables from PRD 12 must exist (`email_audit`, `watcher_rules`, `user_feeds`)
    - Leave Request Workflow (Phase 6) must be fully functional to trigger events
- **Required Skills**:
    - `frontend.md` (for UI components)
    - `backend.md` (implied for Edge Functions/API)
