# Checklist - Task 1.3

**Parent:** 02_detailed_m1_approval_email.md

## Steps
- [x] Step 1: Create validation function to check token exists and not expired
- [x] Step 2: Return LeaveRequest and approverId if valid
- [x] Step 3: Return null if invalid/expired

## Done When
- [x] Validation function created in `lib/token.ts`
- [x] Function checks token exists and expiry date is in future
- [x] Function verifies LeaveRequest status is 'NEW'
- [x] Function returns LeaveRequest data if valid, null otherwise
- [x] Function handles edge cases (null token, malformed token)

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Checklist creation |