# Master Plan - Approval Email

**Status:** In Progress
**Source:** 01_prd_analysis_approval_email.md

## Milestone 1: Token Security & Database
- [x] 1.1: Add `actionToken` and `actionTokenExpiry` fields to LeaveRequest model
- [x] 1.2: Create token generation utility (7-day expiry, single-use)
- [x] 1.3: Create token validation middleware

## Milestone 2: Email Template Update
- [x] 2.1: Update email template with new HTML layout from PRD
- [x] 2.2: Implement dynamic data mapping (user, dates, duration, leave type)
- [x] 2.3: Add Approve/Reject CTA URLs with tokens

## Milestone 3: Quick Approval Flow
- [x] 3.1: Create GET /actions/approve/[token] landing page
- [x] 3.2: Implement POST /api/approve (or Server Action) endpoint
- [x] 3.3: Add audit log entry on approval
- [x] 3.4: Build success feedback UI

## Milestone 4: Rejection Flow
- [x] 4.1: Create GET /actions/reject/[token] page with Shadcn form
- [x] 4.2: Add mandatory textarea for approverComment
- [x] 4.3: Implement POST rejection logic
- [x] 4.4: Build confirmation/redirect UI

## Milestone 5: Edge Cases & Testing
- [x] 5.1: Handle expired token error page
- [x] 5.2: Handle already-processed request UI
- [x] 5.3: Mobile responsiveness verification
- [ ] 5.4: End-to-end integration testing

## 🔄 Next Steps
- Start Milestone 3 by updating/creating the Detailed Phase file.
- Once all tasks are marked [x], trigger `03_documentation.md`.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Initial Plan |
| 2026-04-21 | 1.1 | Completed Milestone 1 (Token Security & Database) |
| 2026-04-21 | 1.2 | Completed Milestone 2 (Email Template Update) |
