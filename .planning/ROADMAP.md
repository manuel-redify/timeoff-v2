## ROADMAP

Overview: This roadmap aligns to the Project Management Settings Module focused on project-user assignment capabilities. It uses the specified tech stack (Next.js 16, React 19, TypeScript, Prisma, PostgreSQL, shadcn/ui) applied to the correct scope of project management and allocations, not generic global settings.

### Depth
- Depth: Standard
- Scope: 4 phases delivered in sequence with observable success criteria.

### Phases

| Phase | Goal | Dependencies | Requirements (v1) | Success Criteria (observable user behaviors) |
|-------|------|--------------|---------------------|------------------------------------------------|
| 1 - Project CRUD and Basic Management | Enable complete project lifecycle management (create, read, update, delete) and basic status handling (active/archived). | None | PRJ-01, PRJ-02 | 1) User can create a new project with core fields (name, description). 2) User can view and list projects with status. 3) User can update project attributes (name, description, client, status). 4) User can archive/activate a project from its detail view. |
| 2 - User-Project Assignments and Allocation Tracking | Support assignment of users to projects and track allocation percentages. | Phase 1 | PRJ-03, PRJ-04 | 1) Admin can assign a user to a project with a non-zero allocation percentage. 2) The allocations list for a project shows all current assignments with percentages. 3) Allocation totals for a project cannot exceed 100%; attempts trigger a clear warning and are blocked. 4) Admin can modify or remove existing allocations and totals update accordingly. 5) A user’s profile page shows the project allocations they are assigned to. |
| 3 - Advanced Features (Validation, Search/Filtering, Client Mgmt) | Introduce validation for allocations, client management, and project search/filtering capabilities. | Phase 2 | PRJ-05, PRJ-06, PRJ-07 | 1) Setting allocation values validates 0-100 and shows errors for invalid values. 2) Admin can create/edit a client and link it to a project; project detail shows linked client. 3) Admin can search and filter projects by name, status, and client; results update as filters change. 4) Project detail consistently displays the linked client and allocation overview. |
| 4 - Integration and Polish (Audit Trails, Performance, Security) | Provide observability, performance, and basic security hardening on the project-management features. | Phase 3 | None (v1) | 1) All CRUD and allocation changes are recorded in an audit trail with timestamp and actor. 2) An audit trail panel is available in the UI to review recent changes. 3) Pages load within acceptable thresholds for typical datasets; loading indicators are shown during long operations. 4) Access controls gate management screens; non-authorized users cannot modify projects or allocations. |

### Progress & Coverage
- Depth: Standard
- Coverage: 7/[7] v1 requirements mapped ✓

### Dependencies
- Phase 2 depends on Phase 1 completion
- Phase 3 depends on Phase 2 completion
- Phase 4 depends on Phase 3 completion

### Draft Presentation Preview

Phase 1: Project CRUD and Basic Management — PRJ-01, PRJ-02
- 4 success criteria as listed above.

Phase 2: User-Project Assignments and Allocation Tracking — PRJ-03, PRJ-04
- 5 success criteria as listed above.

Phase 3: Advanced Features — PRJ-05, PRJ-06, PRJ-07
- 4 success criteria as listed above.

Phase 4: Integration and Polish
- 4 success criteria as listed above.

### Notes for Review
- Requirements are aligned to the described feature clusters from PROJECT.md.
- Optional client management is included in Phase 3 to reflect the ability to associate clients with projects.
- Allocation validation, search/filtering, and audit trails are scheduled for Phase 3 and Phase 4 respectively.
