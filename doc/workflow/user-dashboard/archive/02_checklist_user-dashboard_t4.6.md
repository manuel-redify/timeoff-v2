# Checklist - Task 4.6: Revocation Workflow Modal
**Parent:** 02_detailed_m4_user-dashboard.md

### Steps
- [x] Step 1: Create `RequestRevokeButton.tsx` component (integrated modal)
- [x] Step 2: Add title "Request Revocation"
- [x] Step 3: Add mandatory reason textarea input
- [x] Step 4: Implement validation - reason cannot be empty
- [x] Step 5: Add Submit button (disabled until reason entered)
- [x] Step 6: On submit, call API to update status to PENDING_REVOKE
- [x] Step 7: On success, close modal and update table row pill to yellow with alert icon
- [x] Step 8: Handle error states

### Done When
- [x] Modal appears with reason input
- [x] Reason is mandatory (validation)
- [x] Status updates to PENDING_REVOKE
- [x] Table pill reflects yellow status with alert icon

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Checklist creation |
