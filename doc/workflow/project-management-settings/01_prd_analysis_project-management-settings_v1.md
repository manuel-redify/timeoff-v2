# PRD Analysis - Project Management Settings
**Version:** v1
**Date:** 2026-02-04
**Source PRD:** `doc/prd/prd_project_management_settings.md`

## 🎯 Objective
Introduce a foundation for Project management within system settings, enabling project registration and user association with roles. This module serves as the base for future Capacity Planning (resource allocation and forecasting).

## 📋 Feature & Logic Map
| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | Admin | Create/Edit Project | Dialog and form for Project Name, Client (searchable select with "Create New"), Billable toggle, Description, and Color (12 presets + hex). | Validate with zod. Prevent duplicate [companyId, name]. |
| F02 | Admin | Archive Project | Change status to ARCHIVED. Projects remain visible in history but are not selectable for new user assignments. | Read-only view in user profiles for archived assignments. |
| F03 | Admin | Delete Project | Hard delete only if no `UserProject` records exist. | Disable delete if linked records exist; show tooltip suggesting Archiving. |
| F04 | Admin | User Project Assignment | Multiple assignment rows in User Profile. Select Active projects only, Role (defaults to global if null), Allocation (Decimal, default 100%), and Period (startDate/endDate). | `endDate` must be `>= startDate`. Visual warning if sum of active allocations > 100%. |
| F05 | Admin | Projects View | Searchable and filterable `DataTable`. Columns: Name (w/ color), Client, Billable badge, Status badge, User count, Actions menu. | Handle pagination for > 20-30 projects. |
| F06 | System | Audit Trail | Generate audit records for every create/update/delete of `Project` and `UserProject`. | Capture old vs new values where applicable. |

## 🏗️ Data Entities (Domain Model)
- **Client:** (New) Entity for external clients. Unique per [companyId, name].
- **Project:** (Update) Added `isBillable` (replaces legacy `type`), `color`, and `clientId` (optional relationship). Linked to `Company`. Status: `ACTIVE` or `ARCHIVED`.
- **UserProject:** (Update) Added `allocation` (Decimal 5,2), `startDate` (default now), and `endDate` (optional). Joins `User`, `Project`, and `Role`.

## 🔗 Dependencies & Blockers
- **Internal:** F01 (Project Creation) must support F04 (User Assignment). `UserProject` depends on `User`, `Project`, and `Role`.
- **External:** None.

## 🔧 Technical Stack & Constraints
- **Stack:** shadcn/ui, Tailwind CSS, Lucide React, Prisma (PostgreSQL).
- **Non-Functional:** Deletion restricted by referential integrity (manual check before delete). Pagination required for scalability.
- **Constraints:** Max 100% allocation "warning" threshold, not a strict limit.

## 🚫 Scope Boundaries
- **In-Scope:** Client/Project management, Multi-role assignments, Allocation tracking, Basic audit logging.
- **Out-of-Scope:** Leave approval based on projects, Capacity heatmaps/Gantt, Automatic balancing of user workload.

## ❓ Clarifications Needed
1. **Migration Plan:** Existing `Project` records have a `type` (String). This needs to be migrated to `isBillable`. Should we derive `isBillable` from specific strings?
2. **Audit Strategy:** Confirm if audit logs should be triggered in the service layer or via Prisma middleware to ensure F06 is consistently met.
3. **Role Validation:** Confirm if `allocation` exceeding 100% should only be a visual warning or if hard validation is required in certain use cases. (PRD says visual, but "prevent saving" mentioned for date consistency).
