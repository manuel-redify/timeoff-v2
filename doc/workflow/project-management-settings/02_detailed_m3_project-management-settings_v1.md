# Detailed Phase - Milestone 3
**Parent:** `doc/workflow/project-management-settings/02_task_plan_ project-management-settings_v1.md`
**Files Involved:** 
- `app/(dashboard)/admin/users/[id]/admin-user-form.tsx`
- `components/users/project-assignments-card.tsx`
- `lib/services/user-project-service.ts`
- `app/api/users/[id]/projects/route.ts`

### Task 3.1: "Project Assignments" Card & UI Component
1. [X] Create `components/users/project-assignments-card.tsx`.
2. [X] Implement a dynamic row list using `useFieldArray` (react-hook-form).
3. [X] Row fields: Project Select (Active only), Role Select (default/custom), Allocation (%), Start/End Dates.
4. [X] Include "Add Project" button and "Remove" (Trash) icons.
*Effort: L | Status: [X]*

### Task 3.2: Allocation Logic & Visual Feedback
1. [ ] Implement a computed field/state for "Total Allocation".
2. [ ] Add logic to highlight total in red and show `AlertTriangle` if > 100%.
3. [ ] Implement client-side validation: `endDate >= startDate`.
*Effort: M | Status: [ ]*

### Task 3.3: Data Sync & API Integration
1. [ ] Create `lib/services/user-project-service.ts` to manage `UserProject` records.
2. [ ] Implement `PUT /api/users/[id]/projects` to sync the whole assignment list (Delete/Update/Create logic).
3. [ ] Integrate the Card into `admin-user-form.tsx`.
4. [ ] Ensure initial data fetching for assignments.
*Effort: M | Status: [ ]*

### Task 3.4: Role Resolution & Edge Cases
1. [ ] Implement logic to display "Use default role" when no specific project role is selected.
2. [ ] Handle archived projects in the list (read-only with badge).
3. [ ] Final form submission integration (ensuring assignments are saved with the user profile).
*Effort: S | Status: [ ]*

## 🔄 Next Steps
- Complete all tasks in this file.
- Update the Master Plan (Tier 1) for each completed task.
- When the Milestone is 100% complete, ask for the next Milestone.
- Archive this checklist.