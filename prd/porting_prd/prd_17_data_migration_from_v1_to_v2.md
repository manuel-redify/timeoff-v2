# PRD 17: Data Migration from v1 to v2

**Document Version:** 1.0  
**Date:** January 13, 2026  
**Status:** Initial Draft  
**Author:** Senior Product Manager

---

## Executive Summary

Rebuilding the TimeOff Management Application as version 2 requires a reliable path for migrating legacy business data (v1 - SQLite/Sequelize) to the modern architecture (v2 - Neon/Prisma/PostgreSQL). This document outlines the technical strategy, field-level mappings, and validation procedures to ensure 100% data integrity during the transition.

---

## 1. Migration Scope

### 1.1 Source Environment (v1)
- **Database:** SQLite
- **ORM:** Sequelize
- **Key Entities:** Users, Companies, Departments, LeaveTypes, Leaves (Requests), BankHolidays.

### 1.2 Target Environment (v2)
- **Database:** Neon PostgreSQL
- **ORM:** Prisma
- **Key Entities:** Updated schema defined in [PRD 12](file:///Users/manuel/Coding/timeoff-management-application/porting_prd/prd_12_database_schema_and_data_model.md).

---

## 2. Technical Strategy

### 2.1 Extraction
- Data will be extracted from the v1 SQLite database using a custom Node.js script.
- Support for JSON export as defined in [PRD 10](file:///Users/manuel/Coding/timeoff-management-application/porting_prd/prd_10_administrative_functions.md).

### 2.2 Transformation
- **UUID Generation:** Legacy integer IDs will be replaced with UUIDs. Mapping tables will be maintained during the migration process to preserve relationships.
- **Enum Mapping:** Legacy integer-based statuses (e.g., Leave Status 1-5) will be converted to PostgreSQL Enums (`new`, `approved`, etc.).
- **User Authentication:** Passwords will not be migrated. Users will be invited to the new platform via Clerk, where they will set their credentials.

### 2.3 Loading
- Prisma client will be used to perform batch inserts into the Neon database.
- Row-Level Security (RLS) policies must be temporarily disabled or bypassed using a service role during the migration.

---

## 3. Detailed Data Mapping

## 3. Detailed Data Mapping

### 3.1 Core Entities

#### 3.1.1 Companies
| v1 Field | v2 Field | Transformation Logic |
| :--- | :--- | :--- |
| `id` | `id` (UUID) | Generate new UUID; Map from v1 PK |
| `name` | `name` | Direct mapping |
| `country` | `country` | ISO 3166-1 alpha-2 mapping |
| `timezone` | `timezone` | Default to 'Europe/London' if null |
| `date_format` | `date_format` | Direct mapping |
| `start_of_new_year` | `start_of_new_year` | Direct mapping (1-12) |
| `share_all_absences` | `share_all_absences`| Direct mapping |

#### 3.1.2 Departments
| v1 Field | v2 Field | Transformation Logic |
| :--- | :--- | :--- |
| `id` | `id` (UUID) | Generate new UUID |
| `name` | `name` | Direct mapping |
| `allowance` | `allowance` | Direct mapping (nullable) |
| `boss_id` | `boss_id` | Map to new User UUID |
| `company_id` | `company_id` | Map to new Company UUID |

#### 3.1.3 Users
| v1 Field | v2 Field | Transformation Logic |
| :--- | :--- | :--- |
| `id` | `id` (UUID) | Generate new UUID |
| `email` | `email` | Direct mapping |
| `name` | `name` | Direct mapping |
| `lastname` | `lastname` | Direct mapping |
| `company_id` | `company_id` | Map to new Company UUID |
| `department_id`| `department_id` | Map to new Department UUID |
| `start_date` | `start_date` | Direct mapping |
| `end_date` | `end_date` | Direct mapping |
| `country` | `country` | New field: extract from company or set default |
| `contract_type` | `contract_type`| Default to 'Employee' |
| `admin` | `is_admin` | Boolean mapping |
| `auto_approve` | `is_auto_approve` | Boolean mapping |

#### 3.1.4 Leave Types
| v1 Field | v2 Field | Transformation Logic |
| :--- | :--- | :--- |
| `id` | `id` (UUID) | Generate new UUID |
| `name` | `name` | Direct mapping |
| `color` | `color` | Direct mapping (Hex code) |
| `use_allowance` | `use_allowance` | Direct mapping |
| `limit` | `limit` | Direct mapping |
| `auto_approve` | `auto_approve` | Direct mapping |

### 3.2 Organizational Structure & Junctions

#### 3.2.1 Roles, Areas, Teams, Projects
| Entity | Migration Logic |
| :--- | :--- |
| **Roles** | Migrate from v1 `roles` table; preserve `priority_weight`. |
| **Areas** | Migrate from v1 `areas` table. |
| **Teams** | Migrate from v1 `teams` table. |
| **Projects** | Migrate from v1 `projects` table; preserve `type`. |

#### 3.2.2 Junction Tables
All junction tables must map many-to-many relationships using the newly generated UUIDs:
- `department_supervisor`: Connects `departments` to `users`.
- `user_team`: Connects `users` to `teams`.
- `user_project`: Connects `users` to `projects` (includes `role_id`).
- `user_role_area`: Connects `users` to `roles` and `areas`.

### 3.3 Operational Data

#### 3.3.1 Leave Requests (v1: Leaves)
| v1 Field | v2 Field | Transformation Logic |
| :--- | :--- | :--- |
| `id` | `id` (UUID) | Generate new UUID |
| `user_id` | `user_id` | Map to new User UUID |
| `leave_type_id` | `leave_type_id` | Map to new LeaveType UUID |
| `approver_id` | `approver_id` | Map to new User UUID |
| `status` | `status` (Enum) | 1=new, 2=approved, 3=rejected, 4=pended_revoke, 5=canceled |
| `start_date` | `date_start` | Direct mapping |
| `end_date` | `date_end` | Direct mapping |
| `day_part_start`| `day_part_start` | 1=all, 2=morning, 3=afternoon |
| `day_part_end` | `day_part_end` | 1=all, 2=morning, 3=afternoon |

#### 3.3.2 Other Records
- **Bank Holidays**: Map `date`, `name`, and `country`. Link to `company_id`.
- **Allowance Adjustments**: Map `year`, `adjustment`, `carried_over_allowance`. Link to `user_id`.
- **Schedules**: Map boolean flags for Monday-Sunday. Link to `company_id` or `user_id`.
- **Approval Steps**: Preserve the chain of command for historical requests.

### 3.4 Workflow Rules (new in v2)

#### 3.4.1 Approval Rules
| v1 Source | v2 Field | Transformation Logic |
| :--- | :--- | :--- |
| — | `request_type` | Default to 'LEAVE' |
| — | `project_type` | Map from legacy project context if available |
| — | `subject_role_id` | Map to new Role UUID |
| — | `approver_role_id`| Map to new Role UUID |
| — | `sequence_order` | Preserve sequence from v1 logic |

#### 3.4.2 Watcher Rules
| v1 Source | v2 Field | Transformation Logic |
| :--- | :--- | :--- |
| — | `request_type` | Default to 'LEAVE' |
| — | `role_id` | Map to new Role UUID |
| — | `team_id` | Map to new Team UUID |
| — | `project_id` | Map to new Project UUID |

> [!NOTE]
> While these tables are marked as "(NEW)" in PRD 12, the underlying logic exists in the v1 database and must be extracted from the legacy configuration and hardcoded constraints into the new rule-based tables.

### 4.1 Pre-Migration
- Check for duplicate emails in v1.
- Ensure all foreign key references in v1 are valid.

### 4.2 Post-Migration
- **Checksum Verification:** Match total record counts for each entity between SQLite and Neon.
- **Relationship Audit:** Sample 5% of users to verify their department and leave history mapping.
- **Workflow Test:** Perform a "dry run" with a migrated user to ensure they can submit a new leave request.

---

## 5. Rollback Strategy
1. In case of critical failure, the v2 database will be truncated.
2. The legacy v1 application remains the "Source of Truth" until final decommissioning.

---

## 6. Dependencies
- [PRD 12: Database Schema](file:///Users/manuel/Coding/timeoff-management-application/porting_prd/prd_12_database_schema_and_data_model.md)
- [PRD 10: Administrative Functions](file:///Users/manuel/Coding/timeoff-management-application/porting_prd/prd_10_administrative_functions.md)
- Prisma client configuration in v2 codebase.

---

*Last Updated: January 13, 2026*
