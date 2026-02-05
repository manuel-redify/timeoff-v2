# Checklist - Task 3.4: Role Resolution & Edge Cases
**Parent:** `doc/workflow/project-management-settings/02_detailed_m3_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Implement logic in `RoleSelect` component to show "Use default role" when `roleId` is null.
- [ ] Step 2: Ensure that archived projects already assigned to a user are displayed in the list.
- [ ] Step 3: Implement read-only UI for archived projects (e.g., disabled fields with an "Archived" badge).
- [ ] Step 4: Add form-level validation to prevent assigning a *new* project that is archived.
- [ ] Step 5: Final review of the assignment sync logic for edge cases (e.g., empty assignment lists).
- [x] Step 6: Verify `Audit` trails are correctly integrated into the form save process.

### Done When
- [ ] Projects with no specific role assigned correctly indicate usage of the default role.
- [ ] Archived project assignments are visible but non-editable.
- [ ] Assignment changes trigger appropriate audit log entries.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Milestone 3 complete. Proceed to final Milestone 4?"
