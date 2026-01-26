# Master Plan - Notifications & Communication
**Version:** v1
**Date:** 2026-01-25
**Source:** 01_prd_analysis_v1.md

## 📋 Master Plan

### Milestone 1: Core Infrastructure & Backend (Priority: High)
- [X] 1.1: Update Prisma schema with `Notification` and `NotificationPreference` models
- [X] 1.2: Configure Resend for email delivery via Next.js API/SDK
- [X] 1.3: Develop base email templates using React Email
- [X] 1.4: Implement Notification Event Bus (internal service/singleton)
- [X] 1.5: Setup API endpoints for notifications (GET, PATCH) and preferences (PUT)

### Milestone 2: UI & Frontend Experience (Priority: Medium)
- [X] 2.1: Build `NotificationCenter` component (popover/drawer)
- [X] 2.2: Implement notification badge updates (SWR/polling or manual triggers)
- [X] 2.3: Build User Notification Preferences UI in Profile
- [X] 2.4: Integrate notification list with simple pagination

### Milestone 3: Integration & Workflow (Priority: High)
- [ ] 3.1: Integrate notification triggers into Leave Request submission
- [ ] 3.2: Integrate notification triggers into Approval/Rejection/Cancellation flows
- [ ] 3.3: Implement `watcher_rules` logic in the notification service
- [ ] 3.4: Complete `EmailAudit` integration for all sent communications

**Total:** 13 high-level tasks across 3 milestones
**Dependencies:** 
- Milestone 2 depends on 1.1 and 1.5
- Milestone 3 depends on 1.4 and Phase 6 (Leave Workflow)
**Related Skills:** `backend.md`, `frontend.md`, `03_documentation.md`, `04_git_workflow.md`

## ❓ Technical Decisions
- **Model**: I will add `Notification` and `NotificationPreference` to the schema. 
- **Delivery**: Direct integration with Resend API within the Notification Event Bus.
- **Background**: For serverless performance, I'll leverage Next.js API routes or `waitUntil` if supported, ensuring the main request isn't blocked.
- **Templates**: React Email for maintainability.
