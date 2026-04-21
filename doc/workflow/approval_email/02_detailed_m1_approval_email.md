# Detailed Phase - Milestone 1: Token Security & Database

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** `prisma/schema.prisma`, `lib/token.ts` (new)

## Task 1.1: Add actionToken fields to LeaveRequest model
- [ ] Add `actionToken` field (String, nullable, unique) to LeaveRequest model
- [ ] Add `actionTokenExpiry` field (DateTime, nullable) to LeaveRequest model
- [ ] Run Prisma migration

## Task 1.2: Create token generation utility
- [ ] Create `lib/token.ts` with `generateActionToken()` function
- [ ] Generate UUID-based token
- [ ] Set 7-day expiry from creation date

## Task 1.3: Create token validation middleware
- [ ] Create validation function to check token exists and not expired
- [ ] Return LeaveRequest and approverId if valid
- [ ] Return null if invalid/expired

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Move to Milestone 2 after Task 1.3 is done.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Milestone breakdown |
