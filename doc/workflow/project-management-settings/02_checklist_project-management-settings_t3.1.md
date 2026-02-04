# Checklist - Task 3.1: "Project Assignments" Card & UI Component
**Parent:** `doc/workflow/project-management-settings/02_detailed_m3_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Create `components/users/project-assignments-card.tsx` as a standalone component.
- [ ] Step 2: Define the `ProjectAssignment` schema and type for the form.
- [ ] Step 3: Implement `useFieldArray` from `react-hook-form` to manage assignment rows.
- [ ] Step 4: Build the UI for the individual assignment row (Grid layout).
- [ ] Step 5: Implement `ProjectSelect` (showing only Active projects) within the row.
- [ ] Step 6: Implement `RoleSelect` (including "Use default role" placeholder).
- [ ] Step 7: Add `Allocation` numerical input with `%` suffix.
- [ ] Step 8: Add `DateRangePicker` or dual `DatePicker` for the assignment period.
- [ ] Step 9: Add "Add Project" button and "Trash" icons for row removal.

### Done When
- [ ] "Project Assignments" card renders with a dynamic list of rows.
- [ ] Rows can be added and removed correctly.
- [ ] Selection fields (Project, Role) are populated with correct data.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 3.1 complete. Proceed to Task 3.2?"
