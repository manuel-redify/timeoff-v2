# Database Documentation - Schema Reference
**Version:** v1 | **Date:** 2026-02-05 | **Status:** 🟢 Complete

## Overview

This document provides a comprehensive reference of the database schema, including entity-relationship diagrams, data dictionaries, and index specifications for the TimeOff application.

## Table of Contents

1. [Core Entities](#core-entities)
2. [Project Management Module](#project-management-module)
3. [Supporting Entities](#supporting-entities)
4. [Audit & Logging](#audit--logging)

---

## Core Entities

### Company

Central entity representing an organization in the system.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique identifier |
| `name` | String | Required | Company name |
| `country` | String (2) | Required | ISO country code |
| `timezone` | String | Default: Europe/London | Company timezone |
| `dateFormat` | String | Default: YYYY-MM-DD | Preferred date format |
| `startOfNewYear` | Int | Default: 1 | Fiscal year start month |
| `shareAllAbsences` | Boolean | Default: false | Share absences across company |
| `carryOver` | Int | Default: 0 | Days to carry over |
| `defaultAllowance` | Decimal | Default: 20.00 | Default leave allowance |
| `createdAt` | DateTime | Auto | Creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |
| `deletedAt` | DateTime? | Nullable | Soft delete timestamp |

**Indexes:**
- `deletedAt` - For soft delete filtering
- `name` - For alphabetical listing

---

## Project Management Module

### Client

Represents a client/customer that projects can be associated with.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique identifier |
| `name` | String | Required | Client name |
| `companyId` | String (UUID) | FK → Company | Owning company |
| `createdAt` | DateTime | Auto | Creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |

**Constraints:**
- Unique: `[companyId, name]` - No duplicate client names per company

**Indexes:**
- `companyId` - For company-scoped queries

**Relationships:**
- `company` → Company (Many-to-One)
- `projects` → Project[] (One-to-Many via ClientProjects)

---

### Project

Represents a project within the system for resource allocation and time tracking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique identifier |
| `name` | String | Required | Project name |
| `type` | String | Required | Project type/category |
| `description` | String? | Nullable | Project description |
| `client` | String? | Nullable | Legacy client reference |
| `status` | ProjectStatus | Default: ACTIVE | Current status |
| `archived` | Boolean | Default: false | Archive flag |
| `isBillable` | Boolean | Default: true | Billable project flag |
| `color` | String? | Nullable | UI color code |
| `companyId` | String (UUID) | FK → Company | Owning company |
| `clientId` | String (UUID)? | FK → Client | Associated client |
| `createdAt` | DateTime | Auto | Creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |

**Constraints:**
- Unique: `[companyId, name]` - No duplicate project names per company

**Indexes:**
- `companyId` - For company-scoped queries
- `status` - For status filtering
- `archived` - For archive filtering
- `clientId` - For client-scoped queries

**Relationships:**
- `company` → Company (Many-to-One)
- `clientObj` → Client? (Many-to-One via ClientProjects)
- `userProjects` → UserProject[] (One-to-Many)
- `approvalSteps` → ApprovalStep[] (One-to-Many)
- `watcherRules` → WatcherRule[] (One-to-Many)

**Status Values:**
```
ACTIVE    - Project is active and available
INACTIVE  - Project is temporarily inactive
COMPLETED - Project has been completed
```

---

### UserProject

Junction table representing the assignment of users to projects with allocation details.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique identifier |
| `userId` | String (UUID) | FK → User | Assigned user |
| `projectId` | String (UUID) | FK → Project | Assigned project |
| `roleId` | String (UUID)? | FK → Role | Assigned role on project |
| `allocation` | Decimal (5,2) | Default: 100.00 | Percentage allocation (0-100) |
| `startDate` | DateTime | Default: now() | Assignment start date |
| `endDate` | DateTime? | Nullable | Assignment end date |
| `createdAt` | DateTime | Auto | Creation timestamp |
| `updatedAt` | DateTime | Auto | Last update timestamp |

**Constraints:**
- Unique: `[userId, projectId, roleId]` - No duplicate assignments for same user/project/role combination

**Indexes:**
- `userId` - For user-scoped queries
- `projectId` - For project-scoped queries

**Relationships:**
- `user` → User (Many-to-One)
- `project` → Project (Many-to-One)
- `role` → Role? (Many-to-One)

**Business Rules:**
- Total allocation per user across all projects should not exceed 100%
- End date must be after start date if provided
- Inactive/archived projects should not appear in assignment dropdowns

---

## Supporting Entities

### User

Core user entity (partial schema shown for reference).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Unique identifier |
| `email` | String | Unique email address |
| `name` | String | First name |
| `lastname` | String | Last name |
| `companyId` | String (UUID) | FK → Company |
| `activated` | Boolean | Account active status |
| `isAdmin` | Boolean | Admin flag |

**Key Relationships:**
- `projects` → UserProject[] (One-to-Many)

---

### Role

Represents roles that can be assigned to users on projects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Unique identifier |
| `name` | String | Role name |
| `companyId` | String (UUID) | FK → Company |

**Relationships:**
- Referenced by `UserProject.role`

---

## Audit & Logging

### Audit

Tracks all changes to critical entities for compliance and debugging.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (UUID) | PK | Unique identifier |
| `entityType` | String | Required | Entity type (e.g., "Project", "UserProject") |
| `entityId` | String | Required | ID of affected entity |
| `attribute` | String | Required | Changed attribute or action type |
| `oldValue` | String? | Nullable | Previous value (JSON) |
| `newValue` | String? | Nullable | New value (JSON) |
| `companyId` | String (UUID)? | FK → Company | Tenant context |
| `byUserId` | String (UUID)? | FK → User | User who made the change |
| `at` | DateTime | Default: now() | Timestamp of change |

**Indexes:**
- `[entityType, entityId]` - For entity change history
- `companyId` - For company-scoped queries
- `at` - For time-based queries

**Tracked Entities:**
- Project (creation, modification, archival, deletion)
- UserProject (assignment creation, modification, removal)
- User (creation, updates)

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Company     │────<│     Client       │>────│    Project      │
│  (1)            │     │  (0..*)          │     │  (0..*)         │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
         │                                                │
         │                                                │
         │                                       ┌────────▼────────┐
         │                                       │   UserProject   │
         │                                       │   (Junction)    │
         │                                       └────────┬────────┘
         │                                                │
         │         ┌──────────────────┐                   │
         └────────<│      User        │>──────────────────┘
                   │  (0..*)          │
                   └──────────────────┘
                            │
                            │
                   ┌────────▼────────┐
                   │      Role       │
                   └─────────────────┘
```

**Relationship Details:**

1. **Company → Client** (1:N)
   - One company can have many clients
   - Client belongs to exactly one company
   - Cascade delete: Deleting company deletes all clients

2. **Company → Project** (1:N)
   - One company can have many projects
   - Project belongs to exactly one company
   - Cascade delete: Deleting company deletes all projects

3. **Client → Project** (1:N, Optional)
   - One client can have many projects
   - Project may optionally belong to a client
   - Relation name: "ClientProjects"

4. **User ↔ Project** (N:M via UserProject)
   - Users can be assigned to multiple projects
   - Projects can have multiple users
   - Junction table includes allocation, dates, and role

5. **UserProject → Role** (N:1, Optional)
   - Assignment may optionally specify a role
   - Role is company-scoped

---

## Data Integrity Rules

### Project Management Module

1. **Unique Names**: Client and Project names must be unique within a company
2. **Allocation Limits**: User allocation across all projects should not exceed 100%
3. **Date Validation**: Assignment end date must be after start date
4. **Soft Deletes**: Projects are archived, not deleted, when they have user assignments
5. **Audit Trail**: All create/update/delete operations on Project and UserProject are logged

### Cascade Behaviors

| Parent | Child | Behavior |
|--------|-------|----------|
| Company | Client | CASCADE DELETE |
| Company | Project | CASCADE DELETE |
| Client | Project | SET NULL on clientId |
| Project | UserProject | CASCADE DELETE |
| User | UserProject | CASCADE DELETE |
| Role | UserProject | SET NULL on roleId |

---

## Migration History

| Migration | Description | Date |
|-----------|-------------|------|
| Initial | Base schema with Company, User, LeaveRequest | - |
| Add Client Model | New Client entity for project categorization | 2026-02 |
| Upgrade Project | Added isBillable, color, clientId to Project | 2026-02 |
| Upgrade UserProject | Added allocation, startDate, endDate to UserProject | 2026-02 |
| Add Audit Trail | Audit logging for Project and UserProject changes | 2026-02 |

---

## Notes

- All tables use soft delete pattern where applicable (deletedAt field)
- UUIDs are used as primary keys throughout the schema
- Decimal types use explicit precision for financial/allocation data
- Indexes are optimized for the most common query patterns
- Tenant isolation is enforced via companyId foreign keys
