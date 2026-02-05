# Detailed Phase - Milestone 2
**Parent:** `doc/workflow/project-management-settings/02_task_plan_ project-management-settings_v1.md`
**Files Involved:** 
- `app/(dashboard)/settings/projects/page.tsx`
- `components/settings/projects/data-table.tsx`
- `components/settings/projects/columns.tsx`
- `components/settings/projects/project-dialog.tsx`
- `lib/services/project-service.ts`
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`

### Task 2.1: Project Management Page layout
1. [X] Create `app/(dashboard)/settings/projects/page.tsx` with Admin-only access check.
2. [X] Implement `DataTable` using shadcn components.
3. [X] Define columns: Name (with color circle), Client name, Billable badge, Status badge, User count.
*Effort: M | Status: [X]*

### Task 2.2: Create/Edit Project Modal
1. [X] Create `ProjectDialog` component using shadcn `Dialog` and `Form`.
2. [X] Add fields: name, clientId (searchable select), isBillable (toggle), description, color (presets + hex).
3. [X] Implement `zod` schema for validation.
4. [X] Implement "Create New Client" shortcut within the project dialog.
*Effort: L | Status: [X]*

### Task 2.3: API Endpoints & Service Layer
1. [ ] Create `lib/services/project-service.ts` for database operations.
2. [ ] Implement `POST /api/projects` for creation.
3. [ ] Implement `PATCH /api/projects/[id]` for updates.
4. [ ] Implement `GET /api/projects` with filters (search, archive toggle).
*Effort: M | Status: [ ]*

### Task 2.4: Delete & Archive Logic
1. [ ] Implement `DELETE /api/projects/[id]` with referential integrity check (check `UserProject` exist).
2. [ ] Handle Archive/Unarchive in the update service.
3. [ ] Implement UI feedback (toast notifications, disabled delete button with tooltip).
*Effort: S | Status: [ ]*

## 🔄 Next Steps
- Complete all tasks in this file.
- Update the Master Plan (Tier 1) for each completed task.
- When the Milestone is 100% complete, ask for the next Milestone.
- Archive this checklist.