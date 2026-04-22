# Checklist - Task 5.1

**Parent:** 02_detailed_m5_approval_email.md

## Steps
- [x] Step 1: Create shared error UI for expired tokens
- [x] Step 2: Detect expired or invalid action tokens from page routes
- [x] Step 3: Display message "This link has expired"
- [x] Step 4: Add link to manual login
- [x] Step 5: Apply the error state to both approve/reject entry pages

## Done When
- [x] Expired tokens render a dedicated error card instead of a broken form
- [x] Invalid tokens are handled by the same error path
- [x] The expired state includes the exact message "This link has expired"
- [x] Users can navigate to manual login from the error UI
- [x] Both `/actions/approve/[token]` and `/actions/reject/[token]` show the expired-token page consistently

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-22 | 1.0 | Checklist creation |
