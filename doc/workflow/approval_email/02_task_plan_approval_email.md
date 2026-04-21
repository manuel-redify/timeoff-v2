# Master Plan - Approval Email

**Status:** In Progress
**Source:** 01_prd_analysis_approval_email.md

## Milestone 1: Token Security & Database
- [ ] 1.1: Add `actionToken` and `actionTokenExpiry` fields to LeaveRequest model
- [ ] 1.2: Create token generation utility (7-day expiry, single-use)
- [ ] 1.3: Create token validation middleware

## Milestone 2: Email Template Update
- [ ] 2.1: Update email template with new HTML layout from PRD
- [ ] 2.2: Implement dynamic data mapping (user, dates, duration, leave type)
- [ ] 2.3: Add Approve/Reject CTA URLs with tokens

## Milestone 3: Quick Approval Flow
- [ ] 3.1: Create GET /actions/approve/[token] landing page
- [ ] 3.2: Implement POST /api/approve (or Server Action) endpoint
- [ ] 3.3: Add audit log entry on approval
- [ ] 3.4: Build success feedback UI

## Milestone 4: Rejection Flow
- [ ] 4.1: Create GET /actions/reject/[token] page with Shadcn form
- [ ] 4.2: Add mandatory textarea for approverComment
- [ ] 4.3: Implement POST rejection logic
- [ ] 4.4: Build confirmation/redirect UI

## Milestone 5: Edge Cases & Testing
- [ ] 5.1: Handle expired token error page
- [ ] 5.2: Handle already-processed request UI
- [ ] 5.3: Mobile responsiveness verification
- [ ] 5.4: End-to-end integration testing

## 🔄 Next Steps
- Start Milestone 1 by updating/creating the Detailed Phase file.
- Once all tasks are marked [x], trigger `03_documentation.md`.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Initial Plan |