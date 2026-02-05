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
1. [X] Implement a computed field/state for "Total Allocation" (useWatch).
2. [X] Add a "Total Allocation" summary display in the card footer.
3. [X] Implement conditional styling: text turns red and `AlertTriangle` appears when sum > 100%.
4. [X] Add form validation rule: `allocation` must be between 0 and 100.
5. [X] Implement cross-field validation for the period: `endDate` must be `>= startDate` or null.
6. [X] Provide immediate inline error messages for invalid date ranges.
*Effort: M | Status: [X]*

### Task 3.3: Data Sync & API Integration
1. [X] Create `lib/services/user-project-service.ts` to manage `UserProject` records.
2. [X] Implement `syncUserProjects` logic to diff incoming assignments with existing DB records (Create/Update/Delete).
3. [X] Create API route `app/api/users/[id]/projects/route.ts` with `GET` and `PUT` handlers.
4. [X] Modify `admin-user-form.tsx` to include `ProjectAssignmentsCard` component.
5. [X] Implement initial data fetching for assignments when user form loads.
6. [X] Connect the form submission logic to call the project sync API alongside the user update.
7. [X] Ensure error handling and loading states for assignment synchronization.
*Effort: M | Status: [X]*

### Task 3.4: Role Resolution & Edge Cases
1. [X] Implement logic in `RoleSelect` component to show "Use default role" when `roleId` is null.
2. [X] Ensure that archived projects already assigned to a user are displayed in the list.
3. [X] Implement read-only UI for archived projects (e.g., disabled fields with an "Archived" badge).
4. [X] Add form-level validation to prevent assigning a *new* project that is archived.
5. [X] Final review of assignment sync logic for edge cases (e.g., empty assignment lists).
6. [X] Verify `Audit` trails are correctly integrated into the form save process.
*Effort: S | Status: [X]*

## 🔄 Next Steps
- Complete all tasks in this file.
- Update the Master Plan (Tier 1) for each completed task.
- When the Milestone is 100% complete, ask for the next Milestone.
- Archive this checklist.