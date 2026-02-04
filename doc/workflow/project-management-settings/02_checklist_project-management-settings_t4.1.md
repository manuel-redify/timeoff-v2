# Checklist - Task 4.1: Audit trail integration
**Parent:** `doc/workflow/project-management-settings/02_detailed_m4_project-management-settings_v1.md`

### Steps
- [ ] Step 1: Identify existing `Audit` service/utility usage in the codebase.
- [ ] Step 2: Implement audit logging in `project-service.ts` for:
    - [ ] Project Creation (log name, client, billable status).
    - [ ] Project Modification (capture diff of changed fields).
    - [ ] Project Archiving/Unarchiving.
- [ ] Step 3: Implement audit logging in `user-project-service.ts` for:
    - [ ] New Project Assignment to User.
    - [ ] Removal of Assignment.
    - [ ] Modification of Assignment (allocation, dates, role).
- [ ] Step 4: Verify that `companyId` and `byUserId` are correctly captured in all audit entries.
- [ ] Step 5: Verify the `oldValue` and `newValue` serialization (JSON or stringified) matches existing patterns.
- [ ] Step 6: Manual verification: Trigger changes and check the `audit` table in the database.

### Done When
- [ ] Audit logs are generated for all Project and UserProject CRUD operations.
- [ ] Log entries contain accurate `oldValue`/`newValue` data and metadata.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 4.1 complete. Proceed to Task 4.2?"
