# TimeOff Management v2 - Porting Master Plan

This document outlines the strategic roadmap for porting the TimeOff Management Application from its legacy stack to the modern Next.js architecture.

## Overview
The goal of this porting project is to achieve 100% feature parity with version 1 while modernizing the user experience and codebase. We are moving from a monolith (Express/Sequelize/SQLite) to a serverless-ready stack (Next.js/Prisma/Neon/Clerk). The implementation follows an incremental approach, starting with the foundation and building block-by-block to ensure a stable, testable application at every step.

---

## Phase Sequencing Rules
1. **Infrastructure First**: Establish the database, authentication, and core API standards before building UI.
2. **Foundational Entities**: Build Users, Companies, and Departments first, as most other features depend on them.
3. **Business Logic Core**: Implement leave types and allowance calculations before the request workflow.
4. **Primary Workflow**: Prioritize the leave submission and approval process over reporting and auxiliary functions.
5. **Incremental Validation**: Every phase must result in a buildable application with verifiable progress via tests or UI checks.

---

## Implementation Phases

### Phase 1: Foundation & Setup
- **Goal**: Initialize the project and establish core technical standards.
- **Reference**: [PRD 12](file:///prd/porting_prd/prd_12_database_schema_and_data_model.md), [PRD 13](file:///prd/porting_prd/prd_13_API_specifications.md), [PRD 14](file:///prd/porting_prd/prd_14_security_and_compliance.md)
- **Rationale**: Required before any functional work can begin. Sets the schema and security rules.
- **Complexity**: Medium
- **Status**: ✅ Complete

### Phase 2: User Management & Authentication
- **Goal**: Implement identity management and account profiles.
- **Reference**: [PRD 01](file:///prd/porting_prd/prd_01_user_management.md)
- **Task List**: [development_task_list_02_user_management_authentication.md](file:///implementation_plan/porting/development_task_list_02_user_management_authentication.md)
- **Rationale**: Every feature requires an authenticated user with a specific role.
- **Complexity**: Simple
- **Status**: ✅ Complete

### Phase 3: Company & Organizational Structure
- **Goal**: Define the hierarchy (Departments, Supervisors) and working schedules.
- **Reference**: [PRD 02](file:///prd/porting_prd/prd_02_company_structure.md)
- **Task List**: [development_task_list_03_company_organizational_structure.md](file:///implementation_plan/porting/development_task_list_03_company_organizational_structure.md)
- **Rationale**: Workflow routing relies on department and supervisor relationships.
- **Complexity**: Medium
- **Status**: ✅ Complete

### Phase 4: Leave Type Configuration
- **Goal**: Define the types of time-off and their basic rules.
- **Reference**: [PRD 03](file:///prd/porting_prd/prd_03_leave_types.md)
- **Task List**: [development_task_list_04_leave_type_configuration.md](file:///implementation_plan/porting/development_task_list_04_leave_type_configuration.md)
- **Rationale**: Foundational for both allowances and the request workflow.
- **Complexity**: Simple
- **Status**: ✅ Complete

### Phase 5: Employee Allowance Management
- **Goal**: Implement annual allowance tracking and pro-rated calculations.
- **Reference**: [PRD 06](file:///prd/porting_prd/prd_06_employee_allowance_management.md)
- **Task List**: [development_task_list_05_employee_allowance_management.md](file:///implementation_plan/porting/development_task_list_05_employee_allowance_management.md)
- **Rationale**: Necessary to validate if a user can submit a request (sufficient balance).
- **Complexity**: Complex
- **Status**: ✅ Complete

### Phase 6: Leave Request Workflow
- **Goal**: Build the core leave application and approval process.
- **Reference**: [PRD 04](file:///prd/porting_prd/prd_04_leave_workflow.md)
- **Task List**: [development_task_list_06_leave_request_workflow.md](file:///implementation_plan/porting/development_task_list_06_leave_request_workflow.md)
- **Rationale**: The central feature of the application.
- **Complexity**: Complex
- **Status**: ✅ Complete

### Phase 7: Approval & Supervisor Dashboard
- **Goal**: Create the management interface for supervisors to action requests.
- **Reference**: [PRD 07](file:///prd/porting_prd/prd_07_approval_management_and_supervisor_functions.md)
- **Task List**: [development_task_list_07_approval_supervisor_dashboard.md](file:///implementation_plan/porting/development_task_list_07_approval_supervisor_dashboard.md)
- **Rationale**: Completes the end-to-end user story for leave management.
- **Complexity**: Medium
- **Status**: ✅ Complete

### Phase 8: Calendar Views & Visualization
- **Goal**: Implement the primary visual interfaces (Wall chart, Team views).
- **Reference**: [PRD 05](file:///prd/porting_prd/prd_05_calendar_views_and_visualization.md)
- **Task List**: [development_task_list_08_calendar_views.md](file:///implementation_plan/porting/development_task_list_08_calendar_views.md)
- **Rationale**: Provides the visibility needed for planning absences.
- **Complexity**: Complex
- **Status**: 📋 Task List Ready

### Phase 9: Notifications & Communication
- **Goal**: Implement email and in-app triggers for workflow changes.
- **Reference**: [PRD 08](file:///prd/porting_prd/prd_08_notifications_and_email_system.md)
- **Task List**: [development_task_list_09_notifications_communication.md](file:///implementation_plan/porting/development_task_list_09_notifications_communication.md)
- **Rationale**: Enhances UX by keeping stakeholders informed.
- **Complexity**: Simple
- **Status**: 📋 Task List Ready

### Phase 10: Reporting & Data Export
- **Goal**: Provide data extraction tools for HR and Finance.
- **Reference**: [PRD 09](file:///prd/porting_prd/prd_09_reporting_and_data_export.md)
- **Task List**: [development_task_list_10_reporting_data_export.md](file:///implementation_plan/porting/development_task_list_10_reporting_data_export.md)
- **Rationale**: Necessary for business operations and audit.
- **Complexity**: Medium
- **Status**: 📋 Task List Ready

### Phase 11: Administrative Functions
- **Goal**: Centralize system-wide configuration and audit logs.
- **Reference**: [PRD 10](file:///prd/porting_prd/prd_10_administrative_functions.md)
- **Task List**: [development_task_list_11_administrative_functions.md](file:///implementation_plan/porting/development_task_list_11_administrative_functions.md)
- **Rationale**: Hardens the system for production use.
- **Complexity**: Medium
- **Status**: 📋 Task List Ready

### Phase 12: Mobile & Responsive Polish
- **Goal**: Optimize the experience for mobile users.
- **Reference**: [PRD 11](file:///prd/porting_prd/prd_11_mobile_and_responsive_experience.md)
- **Task List**: [development_task_list_12_mobile_responsive_polish.md](file:///implementation_plan/porting/development_task_list_12_mobile_responsive_polish.md)
- **Rationale**: Ensures the app is usable on all devices.
- **Complexity**: Simple
- **Status**: 📋 Task List Ready

### Phase 13: Final Testing & Deployment
- **Goal**: Complete E2E verification and launch to Vercel production.
- **Reference**: [PRD 15](file:///prd/porting_prd/prd_15_testing_strategy_and_quality_assurance.md), [PRD 16](file:///prd/porting_prd/prd_16_deployment_and_devops.md)
- **Task List**: [development_task_list_13_final_testing_deployment.md](file:///implementation_plan/porting/development_task_list_13_final_testing_deployment.md)
- **Rationale**: Final gateway to production.
- **Complexity**: Medium
- **Status**: 📋 Task List Ready

---

## Detailed Task Lists
Detailed task lists for each phase will be created individually using the [Task List Generation Guide](file:///implementation_plan/porting/task_list_creation_guide.md) as we begin each phase.
