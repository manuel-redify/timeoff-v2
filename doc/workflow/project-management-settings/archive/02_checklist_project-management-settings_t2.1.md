# Checklist - Task 2.1: Project Management Page layout
**Parent:** `doc/workflow/project-management-settings/02_detailed_m2_project-management-settings_v1.md`

### Steps
- [x] Step 1: Create directory `app/(dashboard)/settings/projects`.
- [x] Step 2: Create `app/(dashboard)/settings/projects/page.tsx` with server-side Admin access check (redirect if not admin).
- [x] Step 3: Implement basic Page structure with Header (Title, Subtitle, "New Project" button placeholder).
- [x] Step 4: Define `columns.tsx` for project DataTable with Name, Client, Info badges, and User count.
- [x] Step 5: Implement `data-table.tsx` component using shadcn `DataTable`.
- [x] Step 6: Integrate `DataTable` into the main page with mock data (until API is ready).

### Done When
- [x] Page is accessible at `/settings/projects` for admins.
- [x] DataTable renders correctly with all specified columns and badges.

## 🔄 Next Steps (Agent Instructions)
1. Complete all steps above autonomously.
2. Update this file live after each step.
3. Upon completion:
   - Update Parent Detailed Phase (Tier 2) and Master Plan (Tier 1) to `[x]`.
   - Commit changes via Git.
   - Archive this checklist.
   - Ask user: "Task 2.1 complete. Proceed to Task 2.2?"
