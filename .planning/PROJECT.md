# Project Management Settings Module

## What This Is

Enhancement to the existing TimeOff Management System that introduces project-user assignment capabilities. This module enables administrators to register projects, assign users with specific roles and allocation percentages, and manage project assignments through the settings interface. The system serves as the foundation for future approval workflows and capacity planning features.

## Core Value

Users can be assigned to projects with specific roles and allocation percentages, providing the data foundation for project-based approval workflows and resource planning.

## Requirements

### Validated

- ✓ User authentication and role-based access control — existing
- ✓ Leave request management system — existing  
- ✓ Company and user management — existing
- ✓ Role and permission system — existing
- ✓ Audit trail logging — existing

### Active

- [ ] Project management (CRUD operations)
- [ ] Client management (optional for projects)
- [ ] User-project assignment with allocation tracking
- [ ] Project assignment interface in user management
- [ ] Allocation percentage validation and warnings
- [ ] Project status management (active/archived)
- [ ] Project search and filtering

### Out of Scope

- **Approval workflows** — will be developed in next phase
- **Capacity planning dashboards** — requires allocation data foundation first
- **Automatic allocation balancing** — manual adjustment only
- **Timeline/Gantt charts** — visual workload management
- **Project-based time tracking** — current focus is assignment only

## Context

**Existing System:** Mature TimeOff Management System built on Next.js 16 with React 19, TypeScript, Prisma ORM, and PostgreSQL. The system already handles user authentication, role-based access control, leave requests, and audit logging.

**Technical Environment:** Full-stack Next.js application with service layer architecture, role-based permissions, and comprehensive audit trail system. Uses shadcn/ui components with Tailwind CSS for consistent UI.

**Business Driver:** Organizations need to understand resource allocation across projects to make informed leave approval decisions. The current system lacks visibility into who is working on what, making it difficult to assess project impact when approving leave requests.

## Constraints

- **Technology**: Must use existing Next.js/TypeScript/Prisma stack — maintains consistency with current architecture
- **UI Framework**: Must use shadcn/ui components — maintains design system consistency
- **Data Integrity**: All assignments must be audit-tracked — extends existing audit system
- **Performance**: DataTable must handle 20-30+ projects efficiently — requires pagination consideration
- **Security**: Admin-only access to project management — extends existing RBAC system
- **Database**: PostgreSQL with Prisma ORM — leverages existing database patterns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Allocation percentage stored but only validated | Capture data now for future capacity planning | — Pending |
| Clients optional in first phase | Reduces complexity while maintaining future extensibility | — Pending |
| Archive vs Delete for projects with assignments | Prevents data loss while allowing cleanup | — Pending |
| Assignment warnings only (no enforcement) | Allows flexible over-allocation scenarios | — Pending |

---
*Last updated: 2026-02-04 after initialization*