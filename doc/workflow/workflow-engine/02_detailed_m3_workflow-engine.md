# Detailed Phase - Milestone 3
**Parent:** 02_task_plan_workflow-engine.md
**Files Involved:** `src/settings/workflows/components/MultiSelect.tsx`, `src/settings/workflows/components/TriggerBlock.tsx`, `src/settings/workflows/page.tsx`

### Task 3.1: Build vertical timeline canvas (subtle vertical line + Step Cards)
**Effort:** Medium
1. [ ] Create TimelineContainer component with vertical line background
2. [ ] Implement StepCard base component with positioning logic
3. [ ] Add subtle animations and hover states for cards
4. [ ] Ensure responsive design for mobile stacking

### Task 3.2: Implement Approval Step Card with Resolver/Scope selection and "Auto-Approve" switch
**Effort:** Large
1. [ ] Build ApprovalStepCard component with resolver dropdown
2. [ ] Implement scope selection (Role/Dept/Project) with existing resolver patterns
3. [ ] Add Auto-Approve toggle switch with conditional UI updates
4. [ ] Connect form validation using react-hook-form
5. [ ] Integrate with zod schema validation

### Task 3.3: Implement Parallel Step Container (dashed border, horizontal layout)
**Effort:** Medium
1. [ ] Create ParallelStepContainer with dashed border styling
2. [ ] Implement horizontal flex layout for child steps
3. [ ] Add drag-drop functionality for reordering within parallel groups
4. [ ] Handle step addition/removal in parallel context

### Task 3.4: Add reordering and deletion logic for steps
**Effort:** Medium
1. [ ] Implement drag-drop library integration (react-beautiful-dnd or @dnd-kit)
2. [ ] Add delete buttons with confirmation dialogs
3. [ ] Update form state on reorder/delete operations
4. [ ] Prevent deletion of mandatory steps (e.g., final fallback)

### Task 3.5: Build Watchers Block (notifications-only logic)
**Effort:** Small
1. [ ] Create WatchersBlock component with user/team selector
2. [ ] Implement notification-only flag in form schema
3. [ ] Add email/push notification preference toggles
4. [ ] Connect to existing user/team search components

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when task 3.X is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-12 | 1.0 | Milestone 3 breakdown |