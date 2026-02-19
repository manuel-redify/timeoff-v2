# Detailed Phase - Milestone 5: Detail Drawer
**Parent:** 02_task_plan_user-dashboard.md
**Files Involved:** `components/`, `app/`

### Task 5.1: Create Drawer Component with React Portal (F09) ✅
**Effort:** M
1. [x] Create `Drawer.tsx` component using React Portal
2. [x] Implement portal root element in DOM
3. [x] Handle z-index to overlay correctly
4. [x] Fix overflow issues from Bento Grid structure
5. [x] Add open/close state management
6. [x] Add backdrop overlay with click-to-close

### Task 5.2: Build Drawer Header (F09) ✅
**Effort:** S
1. [x] Add title "Leave Details" or similar
2. [x] Display Reference ID
3. [x] Add Status Pill (colored based on status)
4. [x] Add close button (X) in top-right

### Task 5.3: Add Metadata Display (F09) ✅
**Effort:** S
1. [x] Display Leave Type (from leaveType relation)
2. [x] Display Duration (using helper from Task 1.1)
3. [x] Display User Notes if present
4. [x] Format dates consistently

### Task 5.4: Implement Workflow Timeline Visualization (F10) ✅
**Effort:** L
1. [x] Query all ApprovalStep records for the request
2. [x] Create vertical timeline layout
3. [x] Mark completed steps with checkmark icon, approver name, timestamp
4. [x] Highlight current step with Neon Lime border
5. [x] Display "Awaiting" status for current step
6. [x] Show future steps in grey (neutral-400)
7. [x] Display full approval path in sequence

### Task 5.5: Add Rejection Comment Display (F11) ✅
**Effort:** S
1. [x] Check if status == REJECTED
2. [x] If true, display approverComment field
3. [x] Style in highlighted light red box (#fee2e2)

## 🔄 Next Steps
- Milestone 5 Complete! All tasks finished.
- Archive this document.
- Proceed to Milestone 6: Integration & Polish

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-19 | 1.5 | Task 5.5 completed - RejectionComment component, Milestone 5 complete |
| 2026-02-19 | 1.4 | Task 5.4 completed - WorkflowTimeline component |
| 2026-02-19 | 1.3 | Task 5.3 completed - LeaveDetailsMetadata component |
| 2026-02-19 | 1.2 | Task 5.2 completed - LeaveDetailsHeader component |
| 2026-02-19 | 1.1 | Task 5.1 completed - PortalDrawer component created |
| 2026-02-18 | 1.0 | Milestone breakdown |
