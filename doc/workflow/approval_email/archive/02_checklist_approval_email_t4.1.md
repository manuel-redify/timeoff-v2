# Checklist - Task 4.1

**Parent:** 02_detailed_m4_approval_email.md

## Steps
- [x] Step 1: Create route `app/actions/reject/[token]/page.tsx`
- [x] Step 2: Validate token from URL params
- [x] Step 3: Check token is not expired
- [x] Step 4: Check request status is still NEW
- [x] Step 5: Display request data summary (employee, dates, duration in minutes/hours)
- [x] Step 6: Add Shadcn UI form with mandatory textarea for approverComment
- [x] Step 7: Add "Confirm Rejection" button

## Done When
- [x] Route `app/actions/reject/[token]/page.tsx` exists
- [x] Token validation works correctly (checks existence and expiry)
- [x] Request status verification prevents rejection of already processed requests
- [x] Rejection UI displays request details (employee, dates, leave type, duration)
- [x] Shadcn UI form with mandatory textarea is present
- [x] "Confirm Rejection" button triggers the rejection action
- [x] Page handles missing/invalid tokens gracefully

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Checklist creation |