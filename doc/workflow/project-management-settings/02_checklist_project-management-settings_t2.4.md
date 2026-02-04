# Checklist - Task 2.4: Delete & Archive Logic
**Parent:** `doc/workflow/project-management-settings/02_detailed_m2_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Implement `DELETE` handler in `app/api/projects/[id]/route.ts`.
- [ ] Step 2: Add database-level check to prevent deletion if `UserProject` records exist.
- [ ] Step 3: Implement `archiveProject` and `unarchiveProject` logic in `project-service.ts`.
- [ ] Step 4: Add "Archive/Unarchive" actions to the `DataTable` row menu.
- [ ] Step 5: Add "Delete" action with confirmation dialog.
- [ ] Step 6: Implement tooltips/disabled states for the Delete button when deletion is blocked.
- [ ] Step 7: Add toast notifications for success/error feedback.

### Done When
- [ ] Project can be archived and unarchived, correctly updating its status.
- [ ] Project can only be deleted if it has no assigned users.
- [ ] UI provides clear reasons why a project cannot be deleted.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Milestone 2 complete. Proceed to Milestone 3?"
