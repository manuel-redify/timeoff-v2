# Checklist - Task 3.2

**Parent:** 02_detailed_m3_approval_email.md

## Steps
- [x] Step 1: Create Server Action `approveRequest(token, managerId)`
- [x] Step 2: Re-validate token server-side
- [x] Step 3: Update LeaveRequest: status = APPROVED, decidedAt = now(), approverId = managerId
- [x] Step 4: Invalidate action token (set to null or mark as used)
- [x] Step 5: Handle race conditions (concurrent approval attempts)

## Done When
- [x] POST endpoint `/api/approve` exists and handles approval requests
- [x] Token validation confirms token exists, is not expired, and request is in NEW status
- [x] LeaveRequest is properly updated with APPROVED status, current timestamp, and approver ID
- [x] Action token is invalidated after use to prevent replay attacks
- [x] The implementation handles concurrent requests safely (e.g., using database transactions or unique constraints)
- [x] Audit log entry is created with appropriate details

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Checklist creation |