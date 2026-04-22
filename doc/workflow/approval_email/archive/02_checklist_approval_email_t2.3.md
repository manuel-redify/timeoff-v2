# Checklist - Task 2.3

**Parent:** 02_detailed_m2_approval_email.md

## Steps
- [x] Step 1: Create email utility service to generate action tokens
- [x] Step 2: Modify leave request creation flow to generate token when email is triggered
- [x] Step 3: Build `{{approveUrl}}`: `/actions/approve/[token]`
- [x] Step 4: Build `{{rejectUrl}}`: `/actions/reject/[token]`
- [x] Step 5: Store token in LeaveRequest record (already done in Milestone 1)
- [x] Step 6: Pass tokens to email template as variables

## Done When
- [x] Action tokens are generated for new leave requests
- [x] Tokens are stored in LeaveRequest.actionToken field
- [x] Email templates receive approveUrl and rejectUrl parameters
- [x] Approve URLs point to `/actions/approve/[token]`
- [x] Reject URLs point to `/actions/reject/[token]`
- [x] Tokens are properly validated in the email notification flow

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Checklist creation |