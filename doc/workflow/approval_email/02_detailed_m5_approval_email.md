# Detailed Phase - Milestone 5: Edge Cases & Testing

**Parent:** 02_task_plan_approval_email.md
**Files Involved:** All pages and components

## Task 5.1: Handle expired token error page
- [x] Create error UI for expired tokens
- [x] Display message: "This link has expired"
- [x] Add link to manual login

## Task 5.2: Handle already-processed request UI
- [x] Check if LeaveRequest.status is no longer NEW
- [x] Display: "This request was already processed on [decidedAt]"
- [x] Show final status (APPROVED/REJECTED) with summary

## Task 5.3: Mobile responsiveness verification
- [x] Test all pages on mobile viewport
- [x] Verify CTA buttons are easily tappable (min 44px touch target)
- [x] Ensure text is readable without zooming
- [x] Test form textarea on mobile keyboard

## Task 5.4: End-to-end integration testing
- [ ] Test full approval flow: email → click approve → confirm → success
- [ ] Test full rejection flow: email → click reject → enter comment → confirm → success
- [ ] Test expired token handling
- [ ] Test already-processed request handling
- [ ] Verify audit log entries created correctly
- [ ] Verify token is invalidated after use

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive all checklists and trigger `03_documentation.md`.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-04-21 | 1.0 | Milestone breakdown |
