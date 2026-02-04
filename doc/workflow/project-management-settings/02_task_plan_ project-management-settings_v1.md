# Master Plan - Project Management Settings
**Status:** In Progress
**Source:** `doc/workflow/project-management-settings/01_prd_analysis_project-management-settings_v1.md`

### Milestone 1: Database & Schema Foundations
- [X] 1.1: New `Client` model implementation
- [X] 1.2: Upgrade `Project` model (isBillable, color, clientId)
- [X] 1.3: Upgrade `UserProject` model (allocation, startDate, endDate)
- [ ] 1.4: Prisma migration and client regeneration

### Milestone 2: Project Settings CRUD (Admin)
- [ ] 2.1: Project Management Page layout (DataTable)
- [ ] 2.2: Create/Edit Project Modal (shadcn Dialog + Form)
- [ ] 2.3: Delete Project logic with safety checks (referential integrity)
- [ ] 2.4: Search and Archive/Unarchive functionality

### Milestone 3: User Profile Integration
- [ ] 3.1: "Project Assignments" Card in User Edit/Create view
- [ ] 3.2: Dynamic row addition/removal for multi-project assignment
- [ ] 3.3: Allocation sum logic and visual warning (>100%)
- [ ] 3.4: Role resolution (default vs specific) and date validation

### Milestone 4: Audit & Polish
- [ ] 4.1: Audit trail integration for Project/UserProject changes
- [ ] 4.2: UI/UX polish and responsive layout verification
- [ ] 4.3: Final documentation and sync

## 🔄 Next Steps
- Start Milestone [X] by creating the Detailed Phase file.
- Once all tasks are marked [x], trigger `03_documentation.md`.