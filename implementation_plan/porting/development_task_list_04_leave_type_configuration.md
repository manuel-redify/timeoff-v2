# Phase 4: Leave Type Configuration - Task List

## Overview
This phase focuses on defining the categories of absences (e.g., Vacation, Sick Leave) and their associated rules. Leave types control whether an absence deducts from a user's annual allowance, whether it's automatically approved, and how it appears visually in the application. This configuration is essential before implementing the request workflow and allowance tracking.

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Phase 3 (Company & Organizational Structure) completed.
- [ ] Read and understood [PRD 03: Leave Type Configuration](file:///prd/porting_prd/prd_03_leave_types.md).
- [ ] Familiarity with [PRD 12: Database Schema](file:///prd/porting_prd/prd_12_database_schema_and_data_model.md) regarding leave-related tables.

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Implement LeaveType model**: Add the `LeaveType` model to `schema.prisma` with fields: `id`, `name`, `color`, `use_allowance` (bool), `limit` (int), `sort_order` (int), `auto_approve` (bool), and `companyId`.
  - **Done looks like**: Prisma schema updated, migration generated and applied to the database.
- [ ] **Configure RLS for LeaveTypes**: Define Row Level Security policies to ensure leave types are only visible/manageable within the same company.
  - **Done looks like**: Policies verified to prevent cross-company data access.
- [ ] **Leave Type CRUD Endpoints**: Implement `GET`, `POST`, `PUT`, and `DELETE` (with usage check) endpoints for `/api/leave-types`.
  - **Done looks like**: Endpoints functional and properly authenticated via Clerk.
- [ ] **Default Leave Type Seeding logic**: Implement a service/utility to create "Holiday" and "Sick Leave" types automatically during company initialization.
  - **Done looks like**: New companies registered in the system automatically have these two types available.

### 2. UI & Frontend
- [ ] **Leave Type List Settings**: Build the `/settings/leave-types` page to display all company leave types.
  - **Done looks like**: Types listed in a table or grid, sorted by `sort_order`, then alphabetically.
- [ ] **Leave Type Editor Form**: Build a form (inline or modal) to create and edit leave types.
  - **Done looks like**: Form handles all fields from the data model with appropriate validation (e.g., name uniqueness within company).
- [ ] **Color Picker Component**: Implement a color picker or selection widget using the predefined palette defined in PRD 03.
  - **Done looks like**: Admin can visually select one of the allowed colors or enter a hex code.
- [ ] **Leave Type Visual Indicators**: Ensure the selected color is used as a visual preview in the list and editor.
  - **Done looks like**: UI reflects the configured color coding for each type.

### 3. Integration & Glue Code
- [ ] **Leave Type Dependency Checks**: Implement logic to prevent deletion of leave types that are currently in use by any leave requests.
  - **Done looks like**: API returns an error if a deletion is attempted on an "in-use" type.
- [ ] **Auto-Approval Logic Integration**: Ensure the `auto_approve` flag is respected by the (upcoming) leave request submission service.
  - **Done looks like**: Service methods prepared to handle immediate approval if the flag is set.

## Acceptance Criteria
- [ ] Administrators can create, edit, and delete (if unused) leave types.
- [ ] Each leave type has a configurable name, color, allowance impact, and annual limit.
- [ ] Default leave types are automatically created for every new company.
- [ ] Leave types are correctly isolated by `companyId` via RLS.
- [ ] The display order of leave types is controlled by the `sort_order` field.

## Testing & Validation Checklist
- [ ] Automated tests for Leave Type CRUD operations.
- [ ] Manual verification that newly created companies have default leave types.
- [ ] Verification of RLS: User in Company A cannot see or edit Leave Types of Company B.
- [ ] Validation of `limit` field (ensure only values 0-365 are accepted).
- [ ] UI check for color consistency between the editor and the list.
- [ ] Mobile responsiveness check for the leave type management page.
