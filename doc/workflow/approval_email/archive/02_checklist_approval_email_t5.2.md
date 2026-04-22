# Checklist - Task 5.2

**Parent:** 02_detailed_m5_approval_email.md

## Steps
- [x] Step 1: Detect requests whose status is no longer `NEW`
- [x] Step 2: Create dedicated already-processed UI
- [x] Step 3: Display message "This request was already processed on [decidedAt]"
- [x] Step 4: Show final status (`APPROVED`/`REJECTED`)
- [x] Step 5: Show request summary on both approve/reject entry pages

## Done When
- [x] Processed requests no longer render the pending action state
- [x] The processed UI includes the processed date/time
- [x] The processed UI displays the final request status
- [x] The processed UI includes the request summary
- [x] Both `/actions/approve/[token]` and `/actions/reject/[token]` behave consistently

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-22 | 1.0 | Checklist creation |
