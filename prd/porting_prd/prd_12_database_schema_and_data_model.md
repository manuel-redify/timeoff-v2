# PRD 12: Database Schema & Data Model

Created by: Manuel Magnani
Created time: January 9, 2026 8:10 AM
Category: PRD
Last updated time: January 15, 2026 8:20 AM
Projects: PTO System v2 (https://www.notion.so/PTO-System-v2-2e269d035b1980cf9941ca5e8f7d9338?pvs=21)

**Document Version:** 3.0 (Next.js 14 / Clerk / Neon / Prisma)

**Date:** January 15, 2026

**Status:** Draft - Updated for v2 Tech Stack

**Author:** Senior software engineer

---

## Executive Summary

This document defines the database schema and data model for TimeOff Management Application v2. It transitions the application from a legacy SQLite/Sequelize structure to a modern, scalable architecture using **Neon PostgreSQL** and **Prisma ORM**, with **Clerk** handling authentication.

The schema incorporates all 23 tables discovered in the legacy system analysis, including advanced multi-stage approval workflows and organizational structures.

---

## 1. Tech Stack Overview

| Component | Technology | Role |
| --- | --- | --- |
| **Frontend/Backend** | Next.js 14+ (App Router) | Application framework, API routes, and Server Actions |
| **Authentication** | Clerk | Identity management, session handling, and social login |
| **Database** | Neon PostgreSQL | Serverless relational database storage |
| **ORM** | Prisma | Typesafe database client and migration management |

---

## 2. Clerk-to-Database Mapping

### 2.1 Identity Strategy
Clerk serves as the single source of truth for user authentication. The local database (`users` table) stores a reference to the Clerk user record to link business logic (PTO requests, allowances) with the authenticated session.

### 2.2 User Synchronization (Webhooks)
To maintain data consistency, Clerk Webhooks are used to sync user events to the Neon database:

- **`user.created`**: When a new user signs up or is invited via Clerk, a corresponding record is created in the `users` table via Prisma.
- **`user.updated`**: Changes to the user's name or email in Clerk are reflected in the local `users` record.
- **`user.deleted`**: When a user is removed from Clerk, the local record is marked as deleted (soft-delete).

### 2.3 Authentication Mapping Table

| Neon Field | Clerk Field | Purpose |
| --- | --- | --- |
| `clerk_id` | `user.id` | Unique link between systems (Primary Index) |
| `email` | `user.email_addresses[0]` | Primary contact and identification |
| `name` | `user.first_name` | First name synchronization |
| `lastname` | `user.last_name` | Last name synchronization |

> [!IMPORTANT]
> All relationships in the database MUST use the internal `id` (UUID) for foreign keys, whereas the `clerk_id` is only used to identify the user during the initial request context in Next.js middleware/server components.

---

## 3. Complete Schema Overview (Prisma Model)

### 1.1 Table Categories

**Core Entities (4 tables)**

- companies
- users
- departments
- leave_types

**Operational Data (5 tables)**

- leave_requests (Leaves)
- user_allowance_adjustments
- bank_holidays
- schedules
- sessions

**Organizational Structure (6 tables)**

- roles
- areas
- teams
- projects
- department_supervisor (junction)
- user_team (junction)

**Approval Workflow (4 tables)**

- approval_rules
- approval_steps
- watcher_rules
- user_project (junction with role)

**Supporting Tables (4 tables)**

- email_audit
- user_feeds
- comments
- user_role_area (junction)

**System Tables (2 tables)**

- audit_logs
- schema.prisma (migration tracking)

---

## 4. Core Entities

### 4.1 Company Model

```prisma
model Company {
  id                    String      @id @default(uuid())
  name                  String
  country               String      @db.Char(2) // ISO 3166-1 alpha-2
  timezone              String      @default("Europe/London")
  dateFormat            String      @default("YYYY-MM-DD") @map("date_format")
  startOfNewYear        Int         @default(1) @map("start_of_new_year")
  shareAllAbsences      Boolean     @default(false) @map("share_all_absences")
  isTeamViewHidden      Boolean     @default(false) @map("is_team_view_hidden")
  ldapAuthEnabled       Boolean     @default(false) @map("ldap_auth_enabled")
  ldapAuthConfig        String?     @map("ldap_auth_config")
  carryOver             Int         @default(0) @map("carry_over")
  mode                  Int         @default(1)
  companyWideMessage    String?     @map("company_wide_message")
  integrationApiEnabled Boolean     @default(false) @map("integration_api_enabled")
  integrationApiToken   String      @unique @default(uuid()) @map("integration_api_token")
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")
  deletedAt             DateTime?   @map("deleted_at")

  // Relationships
  users                 User[]
  departments           Department[]
  leaveTypes            LeaveType[]
  bankHolidays          BankHoliday[]
  roles                 Role[]
  areas                 Area[]
  teams                 Team[]
  projects              Project[]
  approvalRules         ApprovalRule[]
  watcherRules          WatcherRule[]
  emailAudits           EmailAudit[]
  comments              Comment[]
  auditLogs             Audit[]
  schedules             Schedule[]

  @@index([deletedAt])
  @@index([name])
  @@map("companies")
}
```

**Legacy Mapping**: v1 `Companies` table

**Key Changes**: Added integration_api fields, mode, company_wide_message. Migrated to UUID for `id`.

---

### 4.2 User Model

```prisma
model User {
  id               String       @id @default(uuid())
  clerkId          String       @unique @map("clerk_id")
  email            String       @unique
  name             String
  lastname         String
  companyId        String       @map("company_id")
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  departmentId     String?      @map("department_id")
  department       Department?  @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  startDate        DateTime     @default(now()) @map("start_date") @db.Date
  endDate          DateTime?    @map("end_date") @db.Date
  country          String?      @db.Char(2)
  contractType     String       @default("Employee") @map("contract_type")
  activated        Boolean      @default(true)
  isAdmin          Boolean      @default(false) @map("is_admin")
  isAutoApprove    Boolean      @default(false) @map("is_auto_approve")
  defaultRoleId    String?      @map("default_role_id")
  defaultRole      Role?        @relation("UserDefaultRole", fields: [defaultRoleId], references: [id], onDelete: SetNull)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")
  deletedAt        DateTime?    @map("deleted_at")

  // Relations
  managedDepartments Department[] @relation("DepartmentBoss")
  supervisedDepartments Department[] @relation("DepartmentSupervisors")
  leaveRequests      LeaveRequest[] @relation("UserLeaves")
  approvedLeaves      LeaveRequest[] @relation("ApproverLeaves")
  allowanceAdjustments UserAllowanceAdjustment[]
  teams               Team[]        @relation("UserTeams")
  projects            UserProject[]
  roleAreas           UserRoleArea[]
  approvalSteps       ApprovalStep[]
  auditLogs           Audit[]
  comments            Comment[]
  feeds               UserFeed[]
  emailAudits         EmailAudit[]

  @@index([clerkId])
  @@index([companyId])
  @@index([departmentId])
  @@index([email])
  @@index([lastname])
  @@index([deletedAt])
  @@map("users")
}
```

**Legacy Mapping**: v1 `Users` table

**Key Changes**: Added `clerk_id`, country, contract_type, default_role_id fields. Removed password field (handled by Clerk). Allowance fields moved to adjustments table.

---

### 4.3 Department Model

```prisma
model Department {
  id                    String      @id @default(uuid())
  name                  String
  allowance             Decimal     @default(9999) @db.Decimal(10, 2) // 9999 = use company default
  includePublicHolidays Boolean     @default(true) @map("include_public_holidays")
  isAccruedAllowance    Boolean     @default(false) @map("is_accrued_allowance")
  bossId                String?     @map("boss_id") // Primary Supervisor (Head of Department)
  boss                  User?       @relation("DepartmentBoss", fields: [bossId], references: [id], onDelete: SetNull)
  companyId             String      @map("company_id")
  company               Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")
  deletedAt             DateTime?   @map("deleted_at")

  // Relationships
  supervisors           User[]      @relation("DepartmentSupervisors") // Secondary Supervisors
  users                 User[]
  
  @@unique([companyId, name, deletedAt])
  @@index([companyId])
  @@index([bossId])
  @@index([deletedAt])
  @@map("departments")
}
```

**Legacy Mapping**: v1 `Departments` table

**Key Changes**: Made allowance nullable, added is_accrued_allowance flag. Handled Secondary Supervisors as a many-to-many relationship in Prisma via the `department_supervisor` table.

---

### 2.4 Department Supervisor Junction Table (NEW)

```sql
CREATE TABLE department_supervisor (
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (department_id, user_id)
);

CREATE INDEX idx_department_supervisor_department_id ON department_supervisor(department_id);
CREATE INDEX idx_department_supervisor_user_id ON department_supervisor(user_id);

ALTER TABLE department_supervisor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view department supervisors"
  ON department_supervisor FOR SELECT
  USING (
    department_id IN (
      SELECT d.id FROM departments d
      WHERE d.company_id IN (
        SELECT company_id FROM users WHERE clerk_id = auth.uid()
      )
    )
  );

```

**Purpose**: Allows multiple Secondary Supervisors per department (many-to-many relationship)

**Legacy**: Found in v1 database

**Note**: This is the PRIMARY way Secondary Supervisors are assigned to departments, complementing the Primary Supervisor (`boss_id`) in the `departments` table. Both have identical approval permissions.

---

### 4.4 Leave Type Model

```prisma
model LeaveType {
  id               String       @id @default(uuid())
  name             String
  color            String       @default("#ffffff")
  useAllowance     Boolean      @default(true) @map("use_allowance")
  limit            Int?
  sortOrder        Int          @default(0) @map("sort_order")
  autoApprove      Boolean      @default(false) @map("auto_approve")
  companyId        String       @map("company_id")
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")
  deletedAt        DateTime?    @map("deleted_at")

  // Relationships
  leaveRequests    LeaveRequest[]

  @@unique([companyId, name, deletedAt])
  @@index([companyId])
  @@map("leave_types")
}
```

**Legacy Mapping**: v1 `LeaveTypes` table

**Key Changes**: Added `auto_approve` flag.

---

## 5. Organizational Structure

### 5.1 Role Model

```prisma
model Role {
  id               String       @id @default(uuid())
  name             String
  priorityWeight   Int          @default(0) @map("priority_weight")
  companyId        String       @map("company_id")
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  // Relationships
  usersDefault     User[]       @relation("UserDefaultRole")
  userProjects     UserProject[]
  userRoleAreas    UserRoleArea[]
  approvalRulesSub ApprovalRule[] @relation("SubjectRole")
  approvalRulesApp ApprovalRule[] @relation("ApproverRole")
  approvalSteps    ApprovalStep[]
  watcherRules     WatcherRule[]

  @@unique([companyId, name])
  @@index([companyId])
  @@map("roles")
}
```

**Purpose**: Define organizational roles for multi-role approval system.

---

### 5.2 Area Model

```prisma
model Area {
  id               String       @id @default(uuid())
  name             String
  companyId        String       @map("company_id")
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  // Relationships
  userRoleAreas    UserRoleArea[]
  approvalRules    ApprovalRule[]

  @@unique([companyId, name])
  @@index([companyId])
  @@map("areas")
}
```

**Purpose**: Define organizational areas.

---

### 5.3 Team Model

```prisma
model Team {
  id               String       @id @default(uuid())
  name             String
  companyId        String       @map("company_id")
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  // Relationships
  users            User[]       @relation("UserTeams")
  watcherRules     WatcherRule[]

  @@unique([companyId, name])
  @@index([companyId])
  @@map("teams")
}
```

**Purpose**: Define teams within the organization.

---

### 5.4 Project Model

```prisma
model Project {
  id               String       @id @default(uuid())
  name             String
  type             String       // 'Project', 'Client', 'Internal', etc.
  companyId        String       @map("company_id")
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  // Relationships
  userProjects     UserProject[]
  approvalSteps    ApprovalStep[]
  watcherRules     WatcherRule[]

  @@unique([companyId, name])
  @@index([companyId])
  @@map("projects")
}
```

**Purpose**: Define projects for project-based approval routing.

---

### 5.5 Junction Models

```prisma
model UserProject {
  id               String       @id @default(uuid())
  userId           String       @map("user_id")
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId        String       @map("project_id")
  project          Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  roleId           String?      @map("role_id")
  role             Role?        @relation(fields: [roleId], references: [id], onDelete: SetNull)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  @@unique([userId, projectId, roleId])
  @@index([userId])
  @@index([projectId])
  @@map("user_project")
}

model UserRoleArea {
  id               String       @id @default(uuid())
  userId           String       @map("user_id")
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId           String       @map("role_id")
  role             Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)
  areaId           String?      @map("area_id")
  area             Area?        @relation(fields: [areaId], references: [id], onDelete: SetNull)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  @@unique([userId, roleId, areaId])
  @@index([userId])
  @@index([roleId])
  @@index([areaId])
  @@map("user_role_area")
}
```

---

## 6. Operational Data

### 6.1 Leave Request Model

```prisma
enum LeaveStatus {
  NEW             @map("new")
  APPROVED        @map("approved")
  REJECTED        @map("rejected")
  PENDING_REVOKE  @map("pending_revoke")
  CANCELED        @map("canceled")
}

enum DayPart {
  ALL        @map("all")
  MORNING    @map("morning")
  AFTERNOON  @map("afternoon")
}

model LeaveRequest {
  id               String       @id @default(uuid())
  dateStart        DateTime     @map("date_start") @db.Date
  dayPartStart     DayPart      @default(ALL) @map("day_part_start")
  dateEnd          DateTime     @map("date_end") @db.Date
  dayPartEnd       DayPart      @default(ALL) @map("day_part_end")
  status           LeaveStatus  @default(NEW)
  userId           String       @map("user_id")
  user             User         @relation("UserLeaves", fields: [userId], references: [id], onDelete: Cascade)
  leaveTypeId      String       @map("leave_type_id")
  leaveType        LeaveType    @relation(fields: [leaveTypeId], references: [id], onDelete: Restrict)
  approverId       String?      @map("approver_id")
  approver         User?        @relation("ApproverLeaves", fields: [approverId], references: [id], onDelete: SetNull)
  employeeComment  String?      @map("employee_comment") @db.Text
  approverComment  String?      @map("approver_comment") @db.Text
  decidedAt        DateTime?    @map("decided_at")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")
  deletedAt        DateTime?    @map("deleted_at")

  // Relationships
  approvalSteps    ApprovalStep[]

  @@index([userId])
  @@index([status])
  @@index([dateStart, dateEnd])
  @@index([deletedAt])
  @@map("leave_requests")
}
```

**Legacy Mapping**: v1 `Leaves` table

**Key Changes**: Renamed from `Leaves` to `leave_requests`. Use Prisma Enums for status and day part.

---

### 6.2 User Allowance Adjustment Model

```prisma
model UserAllowanceAdjustment {
  id                    String      @id @default(uuid())
  year                  Int         @default(dbgenerated("EXTRACT(YEAR FROM CURRENT_DATE)"))
  adjustment            Decimal     @default(0) @db.Decimal(10, 2)
  carriedOverAllowance  Decimal     @default(0) @map("carried_over_allowance") @db.Decimal(10, 2)
  userId                String      @map("user_id")
  user                  User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt             DateTime    @default(now()) @map("created_at")

  @@unique([userId, year])
  @@index([userId])
  @@map("user_allowance_adjustments")
}
```

**Legacy Mapping**: v1 `user_allowance_adjustment` table.

---

### 6.3 Bank Holiday Model

```prisma
model BankHoliday {
  id               String       @id @default(uuid())
  name             String
  date             DateTime     @db.Date
  country          String       @default("UK") @db.Char(2)
  companyId        String       @map("company_id")
  company          Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")
  deletedAt        DateTime?    @map("deleted_at")

  @@unique([companyId, date, deletedAt])
  @@index([companyId])
  @@index([date])
  @@map("bank_holidays")
}
```

**Legacy Mapping**: v1 `BankHolidays` table.

---

### 6.4 Schedule Model

```prisma
model Schedule {
  id               String       @id @default(uuid())
  monday           Int          @default(1) // 1=working, 2=not working, 3=morning, 4=afternoon
  tuesday          Int          @default(1)
  wednesday        Int          @default(1)
  thursday         Int          @default(1)
  friday           Int          @default(1)
  saturday         Int          @default(2)
  sunday           Int          @default(2)
  companyId        String?      @map("company_id")
  company          Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId           String?      @map("user_id")
  user             User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  @@map("schedules")
}
```

**Note**: Sessions table is deprecated in v2 (handled by Clerk).

---

## 5. Approval Workflow System (NEW)

## 7. Approval Workflow System

### 7.1 Approval Rule Model

```prisma
model ApprovalRule {
  id                    String      @id @default(uuid())
  requestType           String      @map("request_type") // 'LEAVE', etc.
  projectType           String      @map("project_type") // 'Project', 'Client', 'Internal', etc.
  subjectRoleId         String      @map("subject_role_id")
  subjectRole           Role        @relation("SubjectRole", fields: [subjectRoleId], references: [id], onDelete: Cascade)
  subjectAreaId         String?     @map("subject_area_id")
  subjectArea           Area?       @relation(fields: [subjectAreaId], references: [id], onDelete: SetNull)
  approverRoleId        String      @map("approver_role_id")
  approverRole          Role        @relation("ApproverRole", fields: [approverRoleId], references: [id], onDelete: Cascade)
  approverAreaConstraint String?    @map("approver_area_constraint") // 'SAME_AS_SUBJECT', 'ANY', etc.
  teamScopeRequired     Boolean     @default(false) @map("team_scope_required")
  sequenceOrder         Int?        @map("sequence_order")
  companyId             String      @map("company_id")
  company               Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")

  @@index([companyId])
  @@index([subjectRoleId])
  @@index([approverRoleId])
  @@map("approval_rules")
}
```

**Purpose**: Define which roles must approve requests from other roles.

---

### 7.2 Approval Step Model

```prisma
model ApprovalStep {
  id                    String      @id @default(uuid())
  leaveId               String      @map("leave_id")
  leaveRequest          LeaveRequest @relation(fields: [leaveId], references: [id], onDelete: Cascade)
  approverId            String      @map("approver_id")
  approver              User        @relation(fields: [approverId], references: [id], onDelete: Cascade)
  roleId                String?      @map("role_id")
  role                  Role?        @relation(fields: [roleId], references: [id], onDelete: SetNull)
  status                Int         // 1=pending, 2=approved, 3=rejected
  sequenceOrder         Int?        @map("sequence_order")
  projectId             String?     @map("project_id")
  project               Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")

  @@index([leaveId])
  @@index([approverId])
  @@map("approval_steps")
}
```

**Purpose**: Track individual approval steps for each leave request.

---

### 7.3 Watcher Rule Model

```prisma
model WatcherRule {
  id                    String      @id @default(uuid())
  requestType           String      @map("request_type")
  projectType           String?     @map("project_type")
  roleId                String?     @map("role_id")
  role                  Role?       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  teamId                String?     @map("team_id")
  team                  Team?       @relation(fields: [teamId], references: [id], onDelete: SetNull)
  projectId             String?     @map("project_id")
  project               Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)
  teamScopeRequired      Boolean     @default(false) @map("team_scope_required")
  contractType          String?     @map("contract_type")
  companyId             String      @map("company_id")
  company               Company     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdAt             DateTime    @default(now()) @map("created_at")
  updatedAt             DateTime    @updatedAt @map("updated_at")

  @@index([companyId])
  @@index([roleId])
  @@map("watcher_rules")
}
```

**Purpose**: Define who should receive notifications about leave requests.

**Purpose**: Define who should receive notifications about leave requests (beyond approvers)

**Example**: "All PMs should be notified of contractor leave requests"

---

## 6. Supporting Tables

## 8. Supporting Tables

### 8.1 Email Audit Model

```prisma
model EmailAudit {
  id               String       @id @default(uuid())
  email            String
  subject          String
  body             String       @db.Text
  companyId        String?      @map("company_id")
  company          Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  userId           String?      @map("user_id")
  user             User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  createdAt        DateTime     @default(now()) @map("created_at")

  @@index([companyId])
  @@index([userId])
  @@index([createdAt])
  @@map("email_audit")
}
```

---

### 8.2 User Feed Model

```prisma
model UserFeed {
  id               String       @id @default(uuid())
  name             String
  feedToken        String       @unique @default(dbgenerated("encode(gen_random_bytes(32), 'hex')")) @map("feed_token")
  type             String       // 'calendar', 'teamview', etc.
  userId           String       @map("user_id")
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  @@index([userId])
  @@index([feedToken])
  @@map("user_feeds")
}
```

---

### 8.3 Comment Model

```prisma
model Comment {
  id               String       @id @default(uuid())
  entityType       String       @map("entity_type")
  entityId         String       @map("entity_id")
  comment          String       @db.Text
  companyId        String?      @map("company_id")
  company          Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  byUserId         String?      @map("by_user_id")
  byUser           User?        @relation(fields: [byUserId], references: [id], onDelete: SetNull)
  at               DateTime     @default(now())

  @@index([entityType, entityId])
  @@index([companyId])
  @@map("comments")
}
```

---

## 9. System Tables

### 9.1 Audit Model

```prisma
model Audit {
  id               String       @id @default(uuid())
  entityType       String       @map("entity_type")
  entityId         String       @map("entity_id")
  attribute        String
  oldValue         String?      @map("old_value") @db.Text
  newValue         String?      @map("new_value") @db.Text
  companyId        String?      @map("company_id")
  company          Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  byUserId         String?      @map("by_user_id")
  byUser           User?        @relation(fields: [byUserId], references: [id], onDelete: SetNull)
  at               DateTime     @default(now())

  @@index([entityType, entityId])
  @@index([companyId])
  @@index([at])
  @@map("audit")
}
```

**Note**: `sequelize_meta` is replaced by Prisma migrations (`prisma migrate`).

**Legacy Mapping**: v1 `audit` table

**Purpose**: Track all data changes for compliance

---

### 7.2 Sequelize Meta Table

```sql
CREATE TABLE sequelize_meta (
  name TEXT PRIMARY KEY
);

```

**Purpose**: Migration tracking for Sequelize (legacy - replace with Supabase migrations in v2)

---

## 8. Utility Functions (UPDATED)

### 8.1 Calculate Working Days Function

```sql
CREATE OR REPLACE FUNCTION calculate_working_days(
  p_start_date DATE,
  p_end_date DATE,
  p_day_part_start day_part,
  p_day_part_end day_part,
  p_company_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_working_days DECIMAL := 0;
  v_current_date DATE;
  v_schedule RECORD;
  v_day_name TEXT;
  v_is_working_day BOOLEAN;
  v_is_bank_holiday BOOLEAN;
BEGIN
  -- Get the schedule (user-specific or company-wide)
  SELECT
    COALESCE(us.monday, cs.monday, 1) as monday,
    COALESCE(us.tuesday, cs.tuesday, 1) as tuesday,
    COALESCE(us.wednesday, cs.wednesday, 1) as wednesday,
    COALESCE(us.thursday, cs.thursday, 1) as thursday,
    COALESCE(us.friday, cs.friday, 1) as friday,
    COALESCE(us.saturday, cs.saturday, 2) as saturday,
    COALESCE(us.sunday, cs.sunday, 2) as sunday
  INTO v_schedule
  FROM companies c
  LEFT JOIN schedules cs ON cs.company_id = c.id
  LEFT JOIN schedules us ON us.user_id = p_user_id
  WHERE c.id = p_company_id
  LIMIT 1;

  -- Loop through each day in the range
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    -- Get day name
    v_day_name := LOWER(TO_CHAR(v_current_date, 'Day'));
    v_day_name := TRIM(v_day_name);

    -- Check if working day
    v_is_working_day := CASE v_day_name
      WHEN 'monday' THEN v_schedule.monday
      WHEN 'tuesday' THEN v_schedule.tuesday
      WHEN 'wednesday' THEN v_schedule.wednesday
      WHEN 'thursday' THEN v_schedule.thursday
      WHEN 'friday' THEN v_schedule.friday
      WHEN 'saturday' THEN v_schedule.saturday
      WHEN 'sunday' THEN v_schedule.sunday
    END;

    -- Check if bank holiday
    SELECT EXISTS(
      SELECT 1 FROM bank_holidays
      WHERE company_id = p_company_id
        AND date = v_current_date
        AND deleted_at IS NULL
    ) INTO v_is_bank_holiday;

    -- Count if working day and not holiday
    IF v_is_working_day AND NOT v_is_bank_holiday THEN
      IF v_current_date = p_start_date AND p_day_part_start != 'all' THEN
        v_working_days := v_working_days + 0.5;
      ELSIF v_current_date = p_end_date AND p_day_part_end != 'all' THEN
        v_working_days := v_working_days + 0.5;
      ELSE
        v_working_days := v_working_days + 1;
      END IF;
    END IF;

    v_current_date := v_current_date + 1;
  END LOOP;

  RETURN v_working_days;
END;
$$ LANGUAGE plpgsql STABLE;

```

**Key Changes**: Added support for day_part (half-days)

---

### 8.2 Calculate User Allowance Function

```sql
CREATE OR REPLACE FUNCTION calculate_user_allowance(
  p_user_id UUID,
  p_year INTEGER DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_user RECORD;
  v_year INTEGER;
  v_base_allowance DECIMAL;
  v_adjustment DECIMAL := 0;
  v_carried_over DECIMAL := 0;
  v_pro_rated_allowance DECIMAL;
  v_months_employed INTEGER;
BEGIN
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));

  -- Get user and department information
  SELECT u.*, d.allowance as dept_allowance
  INTO v_user
  FROM users u
  LEFT JOIN departments d ON u.department_id = d.id
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Base allowance from department
  v_base_allowance := COALESCE(v_user.dept_allowance, 9999);

  -- Handle sentinel value for unlimited/fallback
  IF v_base_allowance = 9999 THEN
    -- If company default is also handled separately, this would be the place.
    -- For now, return large number for unlimited or add more logic if company default is desired.
    RETURN 9999;
  END IF;

  -- Pro-rate if user started mid-year
  IF EXTRACT(YEAR FROM v_user.start_date) = v_year THEN
    v_months_employed := 12 - EXTRACT(MONTH FROM v_user.start_date) + 1;
    v_pro_rated_allowance := (v_base_allowance / 12.0) * v_months_employed;
  ELSE
    v_pro_rated_allowance := v_base_allowance;
  END IF;

  -- Get manual adjustments and carry over for this year
  SELECT
    COALESCE(adjustment, 0),
    COALESCE(carried_over_allowance, 0)
  INTO v_adjustment, v_carried_over
  FROM user_allowance_adjustments
  WHERE user_id = p_user_id
    AND year = v_year
  LIMIT 1;

  RETURN v_pro_rated_allowance + v_adjustment + v_carried_over;
END;
$$ LANGUAGE plpgsql STABLE;

```

**Key Change**: Handle NULL allowance as unlimited

---

### 8.3 Get Approvers for Leave Request

```sql
CREATE OR REPLACE FUNCTION get_approvers_for_leave_request(
  p_user_id UUID,
  p_leave_request_id UUID,
  p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
  approver_id UUID,
  role_id UUID,
  sequence_order INTEGER
) AS $$
BEGIN
  -- This is a simplified version
  -- Full implementation would need to evaluate:
  -- 1. User's roles, areas, teams
  -- 2. Project type
  -- 3. Approval rules matching criteria
  -- 4. Return ordered list of approvers

  RETURN QUERY
  SELECT DISTINCT
    ur.user_id as approver_id,
    ar.approver_role_id as role_id,
    ar.sequence_order
  FROM approval_rules ar
  JOIN user_role_area ura ON ura.role_id = ar.subject_role_id
  JOIN user_role_area ur_approver ON ur_approver.role_id = ar.approver_role_id
  WHERE ura.user_id = p_user_id
    AND ar.request_type = 'LEAVE'
  ORDER BY ar.sequence_order NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

```

**Purpose**: Determine who needs to approve a leave request based on complex rules

**Note**: Simplified version - full implementation would be more complex

---

## 10. Database Functions (PostgreSQL)

> [!NOTE]
> Critical business logic for calculating working days and allowances is maintained as PostgreSQL functions for performance and to ensure consistency regardless of the access method. These are invoked via Prisma's `$queryRaw`.

### 10.1 Calculate Working Days Function

```sql
CREATE OR REPLACE FUNCTION calculate_working_days(
  p_start_date DATE,
  p_end_date DATE,
  p_day_part_start day_part,
  p_day_part_end day_part,
  p_company_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_working_days DECIMAL := 0;
  v_current_date DATE;
  v_schedule RECORD;
  v_day_name TEXT;
  v_is_working_day BOOLEAN;
  v_is_bank_holiday BOOLEAN;
BEGIN
  -- Get the schedule (user-specific or company-wide)
  SELECT
    COALESCE(us.monday, cs.monday, 1) as monday,
    COALESCE(us.tuesday, cs.tuesday, 1) as tuesday,
    COALESCE(us.wednesday, cs.wednesday, 1) as wednesday,
    COALESCE(us.thursday, cs.thursday, 1) as thursday,
    COALESCE(us.friday, cs.friday, 1) as friday,
    COALESCE(us.saturday, cs.saturday, 2) as saturday,
    COALESCE(us.sunday, cs.sunday, 2) as sunday
  INTO v_schedule
  FROM companies c
  LEFT JOIN schedules cs ON cs.company_id = c.id
  LEFT JOIN schedules us ON us.user_id = p_user_id
  WHERE c.id = p_company_id
  LIMIT 1;

  -- Loop through each day in the range
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    v_day_name := LOWER(TO_CHAR(v_current_date, 'Day'));
    v_day_name := TRIM(v_day_name);

    v_is_working_day := CASE v_day_name
      WHEN 'monday' THEN v_schedule.monday
      WHEN 'tuesday' THEN v_schedule.tuesday
      WHEN 'wednesday' THEN v_schedule.wednesday
      WHEN 'thursday' THEN v_schedule.thursday
      WHEN 'friday' THEN v_schedule.friday
      WHEN 'saturday' THEN v_schedule.saturday
      WHEN 'sunday' THEN v_schedule.sunday
    END;

    SELECT EXISTS(
      SELECT 1 FROM bank_holidays
      WHERE company_id = p_company_id
        AND date = v_current_date
        AND deleted_at IS NULL
    ) INTO v_is_bank_holiday;

    IF v_is_working_day != 2 AND NOT v_is_bank_holiday THEN
      -- Full day = 1.0, Morning/Afternoon = 0.5
      DECLARE
        v_day_weight DECIMAL := CASE WHEN v_is_working_day = 1 THEN 1.0 ELSE 0.5 END;
        v_req_weight DECIMAL := 1.0;
      BEGIN
        IF v_current_date = p_start_date AND p_day_part_start != 'all' THEN
          v_req_weight := 0.5;
          -- Check if request matches half-day schedule
          IF (v_is_working_day = 3 AND p_day_part_start = 'afternoon') OR
             (v_is_working_day = 4 AND p_day_part_start = 'morning') THEN
            v_req_weight := 0;
          END IF;
        ELSIF v_current_date = p_end_date AND p_day_part_end != 'all' THEN
          v_req_weight := 0.5;
          -- Check if request matches half-day schedule
          IF (v_is_working_day = 3 AND p_day_part_end = 'afternoon') OR
             (v_is_working_day = 4 AND p_day_part_end = 'morning') THEN
            v_req_weight := 0;
          END IF;
        END IF;

        v_working_days := v_working_days + LEAST(v_day_weight, v_req_weight);
      END;
    END IF;

    v_current_date := v_current_date + 1;
  END LOOP;

  RETURN v_working_days;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 10.2 Calculate User Allowance Function

```sql
CREATE OR REPLACE FUNCTION calculate_user_allowance(
  p_user_id UUID,
  p_year INTEGER DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_user RECORD;
  v_year INTEGER;
  v_base_allowance DECIMAL;
  v_adjustment DECIMAL := 0;
  v_carried_over DECIMAL := 0;
  v_pro_rated_allowance DECIMAL;
  v_months_employed INTEGER;
BEGIN
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));

  SELECT u.*, d.allowance as dept_allowance
  INTO v_user
  FROM users u
  LEFT JOIN departments d ON u.department_id = d.id
  WHERE u.id = p_user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_base_allowance := COALESCE(v_user.dept_allowance, 9999);

  IF v_base_allowance = 9999 THEN
    RETURN 9999; 
  END IF;

  IF EXTRACT(YEAR FROM v_user.start_date) = v_year THEN
    v_months_employed := 12 - EXTRACT(MONTH FROM v_user.start_date) + 1;
    v_pro_rated_allowance := (v_base_allowance / 12.0) * v_months_employed;
  ELSE
    v_pro_rated_allowance := v_base_allowance;
  END IF;

  SELECT
    COALESCE(adjustment, 0),
    COALESCE(carried_over_allowance, 0)
  INTO v_adjustment, v_carried_over
  FROM user_allowance_adjustments
  WHERE user_id = p_user_id
    AND year = v_year
  LIMIT 1;

  RETURN v_pro_rated_allowance + v_adjustment + v_carried_over;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 11. Database Views

### 11.1 User Allowance Summary View

```sql
CREATE OR REPLACE VIEW vw_user_allowance_summary AS
SELECT
  u.id as user_id,
  u.clerk_id,
  u.name || ' ' || u.lastname as full_name,
  u.company_id,
  u.department_id,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER as year,
  calculate_user_allowance(u.id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER) as total_allowance,
  (
    SELECT COALESCE(SUM(
      calculate_working_days(
        lr.date_start,
        lr.date_end,
        lr.day_part_start,
        lr.day_part_end,
        u.company_id,
        u.id
      )
    ), 0)
    FROM leave_requests lr
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE lr.user_id = u.id
      AND lr.status = 'approved'
      AND EXTRACT(YEAR FROM lr.date_start) = EXTRACT(YEAR FROM CURRENT_DATE)
      AND lt.use_allowance = TRUE
      AND lr.deleted_at IS NULL
  ) as used_allowance
FROM users u
WHERE u.deleted_at IS NULL
  AND u.activated = TRUE;
```

### 11.2 Pending Approvals View

```sql
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT
  lr.id as leave_request_id,
  lr.user_id,
  u.name || ' ' || u.lastname as employee_name,
  u.email as employee_email,
  lr.date_start,
  lr.day_part_start,
  lr.date_end,
  lr.day_part_end,
  calculate_working_days(
    lr.date_start,
    lr.date_end,
    lr.day_part_start,
    lr.day_part_end,
    u.company_id,
    u.id
  ) as days_requested,
  lt.name as leave_type_name,
  lt.color as leave_type_color,
  lr.employee_comment,
  lr.created_at,
  d.id as department_id,
  d.name as department_name,
  u.company_id
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
LEFT JOIN departments d ON u.department_id = d.id
WHERE lr.status = 'new'
  AND lr.deleted_at IS NULL
  AND u.deleted_at IS NULL;
```

---

## 12. Data Migration from v1 to v2

### 12.1 Integration Strategy
- **ORM Transition**: Sequelize (v1) → Prisma (v2).
- **Identity Transition**: Local Password → Clerk (v2).
- **Database Transition**: SQLite → Neon PostgreSQL (v2).

### 12.2 Clerk Migration Workflow
1. Export users from v1.
2. Bulk-import to Clerk (or lazy-migrate on first login).
3. Update Neon `users` table with the resulting `clerk_id`.

---

## 13. Implementation Priorities (v2)

### Phase 1: Core & Auth (Week 1)
1. **Infra**: Neon setup, Prisma initialization.
2. **Auth**: Clerk integration, webhook for user sync.
3. **Core**: `companies`, `users`, `departments`, `leave_types`.

### Phase 2: Leave & Operations (Week 2)
1. **Operational**: `leave_requests`, `bank_holidays`, `schedules`.
2. **Functions**: Migration of `calculate_working_days`.

### Phase 3: Advanced Structure (Week 3)
1. **Multi-role**: `roles`, `areas`, `teams`, `projects`.
2. **Junctions**: `user_team`, `user_project`, `user_role_area`.

### Phase 4: Approval Workflows (Week 4)
1. **Logics**: `approval_rules`, `approval_steps`, `watcher_rules`.

---

### 14.1 Schema Validation

- [ ]  All tables created successfully
- [ ]  All foreign keys valid and enforced
- [ ]  All constraints working (CHECK, UNIQUE)
- [ ]  All indexes created and used by queries
- [ ]  All triggers functioning

### 14.2 Function Testing

- [ ]  calculate_working_days handles half-days correctly
- [ ]  calculate_working_days excludes weekends/holidays
- [ ]  calculate_user_allowance handles NULL (unlimited)
- [ ]  calculate_user_allowance pro-rates correctly
- [ ]  get_approvers returns correct approvers based on rules
- [ ]  get_watchers returns correct watchers

### 14.3 RLS Testing

- [ ]  Users see only their company data
- [ ]  Admins see all company data
- [ ]  Supervisors see department data
- [ ]  Multi-supervisor access works correctly
- [ ]  Cross-company data isolation enforced

### 14.4 Migration Testing

- [ ]  All v1 data migrates without loss
- [ ]  Status enums convert correctly
- [ ]  Day part enums convert correctly
- [ ]  Schedule booleans convert correctly
- [ ]  UUIDs generate uniquely
- [ ]  Relationships maintain integrity

---

## 15. Acceptance Criteria (UPDATED)

✅ All 23 tables from legacy database mapped to v2

✅ All relationships properly defined with foreign keys

✅ All constraints in place (including NULL allowance = unlimited)

✅ RLS policies for all tables

✅ Functions support half-days and complex allowance logic

✅ Multi-role approval system fully modeled

✅ Watcher notification system included

✅ Migration path defined for all legacy data

✅ Status/day_part enums properly mapped

✅ Flexible organizational structure (roles/areas/teams/projects)

---

## Document Change Log

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | 2026-01-08 | PM Team | Initial draft |
| 2.0 | 2026-01-09 | PM Team | Complete rewrite based on actual database analysis - added 11 missing tables, updated all table structures, added multi-role approval system |

---

*End of PRD 12 Part 2 - Database Schema*