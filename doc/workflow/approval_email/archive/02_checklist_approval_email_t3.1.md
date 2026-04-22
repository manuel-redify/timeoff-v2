# Checklist - Task 3.1

**Parent:** 02_detailed_m3_approval_email.md

## Steps
- [x] Step 1: Create route `app/actions/approve/[token]/page.tsx`
- [x] Step 2: Validate token from URL params
- [x] Step 3: Check token is not expired
- [x] Step 4: Check request status is still NEW
- [x] Step 5: Display confirmation UI with request details
- [x] Step 6: Add "Approve Now" button (triggers POST)

## Done When
- [x] Route `app/actions/approve/[token]/page.tsx` exists
- [x] Token validation works correctly (checks existence and expiry)
- [x] Request status verification prevents approval of already processed requests
- [x] Confirmation UI displays request details (employee, dates, leave type, duration)
- [x] "Approve Now" button triggers the approval action
- [x] Page handles missing/invalid tokens gracefully

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Checklist creation |