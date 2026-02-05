# Checklist - Task 4.1: Audit trail integration
**Parent:** `doc/workflow/project-management-settings/02_detailed_m4_project-management-settings_v1.md`

### Steps
- [x] Step 1: Identify existing `Audit` service/utility usage in the codebase.
- [x] Step 2: Implement audit logging in `project-service.ts` for:
    - [x] Project Creation (log name, client, billable status).
    - [x] Project Modification (capture diff of changed fields).
    - [x] Project Archiving/Unarchiving.
- [x] Step 3: Implement audit logging in `user-project-service.ts` for:
    - [x] New Project Assignment to User.
    - [x] Removal of Assignment.
    - [x] Modification of Assignment (allocation, dates, role).
- [x] Step 4: Verify that `companyId` and `byUserId` are correctly captured in all audit entries.
- [x] Step 5: Verify the `oldValue` and `newValue` serialization (JSON or stringified) matches existing patterns.
- [x] Step 6: TypeScript compilation verification.

### Done When
- [x] Audit logs are generated for all Project and UserProject CRUD operations.
- [x] Log entries contain accurate `oldValue`/`newValue` data and metadata.

## Summary of Changes

### `lib/services/project-service.ts`
- Added `byUserId` optional parameter to `createProject()`, `updateProject()`, `archiveProject()`, `unarchiveProject()`, and `deleteProject()` methods
- Implemented audit logging for:
  - **Project Creation**: Logs name, client, billable status, description, type, color, status, archived
  - **Project Modification**: Captures diff of changed fields (name, description, client, status, isBillable, archived, color)
  - **Project Archiving**: Logs transition from archived=false to archived=true
  - **Project Unarchiving**: Logs transition from archived=true to archived=false
  - **Project Deletion**: Logs complete project details before deletion

### `lib/services/user-project-service.ts`
- Added `companyId` and `byUserId` optional parameters to `syncUserProjects()` method
- Fixed assignment deletion logic (was not working correctly before)
- Implemented audit logging for:
  - **Assignment Creation**: Logs user details, project details, role, allocation, dates
  - **Assignment Modification**: Captures diff of changes (role, allocation, startDate, endDate)
  - **Assignment Removal**: Logs complete assignment details before removal
- Uses batch audit log creation (`audit.createMany`) for efficiency

### API Routes Updated
- `app/api/projects/route.ts`: Passes `session.user.id` to `createProject()`
- `app/api/projects/[id]/route.ts`: Passes `session.user.id` to `updateProject()`, `archiveProject()`, `unarchiveProject()`, and `deleteProject()`
- `app/api/users/[id]/projects/route.ts`: Passes `session.user.companyId` and `session.user.id` to `syncUserProjects()`

### Audit Log Schema Compliance
All audit logs follow the existing pattern:
- `entityType`: "Project" or "UserProject"
- `entityId`: UUID of the affected entity
- `attribute`: Action type (creation, modification, archived, unarchived, deletion, assignment_created, assignment_modified, assignment_removed)
- `oldValue`: JSON string of previous state (null for creations)
- `newValue`: JSON string of new state (null for deletions/modifications)
- `companyId`: Tenant isolation
- `byUserId`: User who performed the action

## 🔄 Next Steps (Agent Instructions)
1. ✅ Complete all steps above autonomously.
2. ✅ Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 4.1 complete. Proceed to Task 4.2?"
