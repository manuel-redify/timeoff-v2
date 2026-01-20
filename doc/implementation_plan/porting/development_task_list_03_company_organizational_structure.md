# Phase 3: Company & Organizational Structure - Task List

## Overview
This phase establishes the organizational framework of the application. It involves defining company-wide settings, creating the departmental hierarchy with supervisor assignments, and configuring working schedules and public holidays. This structure is foundational for routing leave requests and calculating allowances correctly.

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Read and understood [PRD 02: Company & Organizational Structure](file:///prd/porting_prd/prd_02_company_structure.md).
- [ ] Familiarity with [PRD 12: Database Schema](file:///prd/porting_prd/prd_12_database_schema_and_data_model.md) regarding organizational tables.

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Implement Prisma Models**: Define `Company`, `Department`, `DepartmentSupervisor`, `Schedule`, and `BankHoliday` in `schema.prisma`.
  - **Done looks like**: Models synced to Neon DB and Prisma client regenerated.
- [ ] **Configure RLS Policies**: Implement Row Level Security policies for all organizational tables to ensure data isolation.
  - **Done looks like**: Policies verified via Supabase dashboard or SQL scripts.
- [ ] **Company API Endpoints**: Implement `GET /api/company` and `PATCH /api/company` for settings management.
  - **Done looks like**: Admin can retrieve and update company configuration via API.
- [ ] **Department CRUD Endpoints**: Implement full CRUD for departments.
  - **Done looks like**: Integration tests passing for creating, reading, updating, and deleting (if empty) departments.
- [ ] **Supervisor Management Endpoints**: Implement endpoints to add/remove primary and secondary supervisors from departments.
  - **Done looks like**: `DepartmentSupervisor` records correctly updated via API.
- [ ] **Schedule Management Endpoints**: Implement endpoints for company-wide and user-specific schedules.
  - **Done looks like**: API handles `XOR` logic for `company_id` and `user_id` correctly.
- [ ] **Bank Holiday Endpoints**: Implement endpoints for manual holiday management and country-based import.
  - **Done looks like**: Admin can add, edit, delete, and bulk-load holidays.

### 2. UI & Frontend
- [ ] **Company Settings View**: Build `/settings/company` page with forms for all settings (timezone, date format, etc.).
  - **Done looks like**: Page functional and styling matches design system; settings persist on save.
- [ ] **Department Management View**: Build `/settings/departments` list and "Create Department" modal.
  - **Done looks like**: Departments listed with edit/delete actions functional.
- [ ] **Department Details & Supervisors**: Build detailed view for departments to manage secondary supervisors.
  - **Done looks like**: Interface allows multi-selection of users to be assigned as supervisors.
- [ ] **Working Schedule Editor**: Build the visual schedule editor (Mon-Sun working day toggles).
  - **Done looks like**: Editor reusable for both company-wide and individual user profiles.
- [ ] **Bank Holiday Management View**: Build `/settings/holidays` page with filtering by year and country.
  - **Done looks like**: Holidays displayed correctly in company date format.
- [ ] **User Profile Schedule Integration**: Add schedule management section to the User Profile page.
  - **Done looks like**: Admins can override an individual's schedule from their profile.

### 3. Integration & Glue Code
- [ ] **Company Initialization Logic**: Implement the service that creates defaults (department, schedule, holidays) upon new company registration.
  - **Done looks like**: Registering a new company results in a fully initialized organizational structure.
- [ ] **Holiday Auto-Generation Service**: Implement the logic to fetch/generate holidays for specific countries based on predefined lists.
  - **Done looks like**: Selecting "UK" during setup automatically populates UK bank holidays.
- [ ] **Allowance Calculation Integration**: Ensure department and schedule settings are accessible to the (upcoming) allowance calculation engine.
  - **Done looks like**: Helper functions correctly resolve a user's applicable schedule and holiday set.

## Acceptance Criteria
- [ ] Admin can configure all company-wide settings (timezone, date format, carry-over, etc.).
- [ ] Departments can be created with assigned supervisors and specific allowance overrides.
- [ ] Multiple supervisors (primary and secondary) can manage the same department.
- [ ] Working schedules can be defined at both company and individual user levels.
- [ ] Public holidays can be imported by country and displayed in lists.
- [ ] All organizational changes are reflected immediately in the UI and enforced via RLS.

## Testing & Validation Checklist
- [ ] Automated tests for all new API endpoints.
- [ ] Manual verification of company setup flow for a new user.
- [ ] Manual verification of department supervisor permissions (visibility of team data).
- [ ] Validation of XOR constraint on Schedule table (cannot have both company and user ID).
- [ ] Verification of date display across different company-configured date formats.
- [ ] Mobile responsiveness check for department list and schedule editors.
