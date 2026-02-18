# Detailed Phase - Milestone 5: Detail Drawer
**Parent:** 02_task_plan_user-dashboard.md
**Files Involved:** `components/`, `app/`

### Task 5.1: Create Drawer Component with React Portal (F09)
**Effort:** M
1. [ ] Create `Drawer.tsx` component using React Portal
2. [ ] Implement portal root element in DOM
3. [ ] Handle z-index to overlay correctly
4. [ ] Fix overflow issues from Bento Grid structure
5. [ ] Add open/close state management
6. [ ] Add backdrop overlay with click-to-close

### Task 5.2: Build Drawer Header (F09)
**Effort:** S
1. [ ] Add title "Leave Details" or similar
2. [ ] Display Reference ID
3. [ ] Add Status Pill (colored based on status)
4. [ ] Add close button (X) in top-right

### Task 5.3: Add Metadata Display (F09)
**Effort:** S
1. [ ] Display Leave Type (from leaveType relation)
2. [ ] Display Duration (using helper from Task 1.1)
3. [ ] Display User Notes if present
4. [ ] Format dates consistently

### Task 5.4: Implement Workflow Timeline Visualization (F10)
**Effort:** L
1. [ ] Query all ApprovalStep records for the request
2. [ ] Create vertical timeline layout
3. [ ] Mark completed steps with checkmark icon, approver name, timestamp
4. [ ] Highlight current step with Neon Lime border
5. [ ] Display "Awaiting" status for current step
6. [ ] Show future steps in grey (neutral-400)
7. [ ] Display full approval path in sequence

### Task 5.5: Add Rejection Comment Display (F11)
**Effort:** S
1. [ ] Check if status == REJECTED
2. [ ] If true, display approverComment field
3. [ ] Style in highlighted light red box (#fee2e2)

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Task 5.1-5.5 are finished.
- Proceed to Milestone 6: Integration & Polish

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Milestone breakdown |
