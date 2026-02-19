# Detailed Phase - Milestone 4: Requests Table
**Parent:** 02_task_plan_user-dashboard.md
**Files Involved:** `components/`, `app/`, `lib/`

### Task 4.1: Implement Requests Table with Columns (F04) ✅
**Effort:** M
1. [x] Create `RequestsTable.tsx` component positioned below Bento Grid
2. [x] Add columns: Type, Period (start/end dates), Duration, Status (pill), Submitted (creation date), Actions
3. [x] Connect to leave requests query from Task 1.2
4. [x] Apply Redify styling (borders, radius, typography)

### Task 4.2: Add Annual Filter Dropdown (F04) ✅
**Effort:** S
1. [x] Create year filter dropdown component
2. [x] Position in top-right of table
3. [x] Filter requests by year based on dateStart
4. [x] Include current year as default option

### Task 4.3: Build Table Action - View (F05)
**Effort:** S
1. [ ] Add View button in Actions column
2. [ ] Implement drawer open handler using request id
3. [ ] Connect to Drawer component (Milestone 5)

### Task 4.4: Build Table Action - Cancel (F06)
**Effort:** M
1. [ ] Add Cancel button visible only when TODAY < dateStart
2. [ ] Implement immediate status update to CANCELED
3. [ ] Add confirmation dialog before cancellation
4. [ ] Handle API call to update status

### Task 4.5: Build Table Action - Request Revoke (F07)
**Effort:** M
1. [ ] Add Request Revoke button visible only when TODAY >= dateStart AND status == APPROVED
2. [ ] Disable button while status is PENDING_REVOKE
3. [ ] Connect to revocation workflow (Task 4.6)

### Task 4.6: Implement Revocation Workflow Modal (F08)
**Effort:** M
1. [ ] Create `RevokeModal.tsx` component
2. [ ] Add mandatory reason input field
3. [ ] Validate reason is not empty
4. [ ] On submit, update status to PENDING_REVOKE
5. [ ] Update table pill to yellow with alert icon

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Task 4.1-4.6 are finished.
- Proceed to Milestone 5: Detail Drawer

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Milestone breakdown |
