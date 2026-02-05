# Checklist - Task 3.3: Data Sync & API Integration
**Parent:** `doc/workflow/project-management-settings/02_detailed_m3_project-management-settings_v1.md`

### Steps
- [x] Step 1: Create `lib/services/user-project-service.ts` with `getUserProjects` and `syncUserProjects` methods.
- [x] Step 2: Implement `syncUserProjects` logic to diff incoming assignments with existing DB records (Create/Update/Delete).
- [x] Step 3: Create API route `app/api/users/[id]/projects/route.ts` with `GET` and `PUT` handlers.
- [x] Step 4: Modify `admin-user-form.tsx` to include the `ProjectAssignmentsCard` component.
- [x] Step 5: Implement initial data fetching for assignments when user form loads.
- [x] Step 6: Connect the form submission logic to call the project sync API alongside with user update.
- [x] Step 7: Ensure error handling and loading states for assignment synchronization.

### Done When
- [x] Assignments are correctly loaded when editing a user.
- [x] Changes to assignments (Add/Edit/Remove) are persisted to the database on form save.
- [x] Sync logic correctly handles partial updates and row deletions.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 3.3 complete. Proceed to Task 3.4?"
