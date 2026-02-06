# Backend Map (Manifest)
**Latest Version:** v1 | **Date:** 2026-02-06
**Parent:** [00_doc_master.md](00_doc_master.md) | **Dependencies:** [02_database_v1.md](02_database_v1.md), [01_architecture.md](01_architecture.md)

## TL;DR (3 lines max)
> **AI Instruction:** Read ONLY this TL;DR. This is a machine-readable manifest of models, actions, services, and security patterns to prevent architectural drift.

## Data Schema Summary
| Model | Primary Key | Key Foreign Keys | Core Purpose |
|-------|-------------|------------------|--------------|
| `Company` | `id` (UUID) | - | Tenant root entity. |
| `User` | `id` (UUID) | `companyId`, `departmentId`, `roleId`, `areaId` | User profile, auth integration, and org placement. |
| `LeaveRequest` | `id` (UUID) | `userId`, `leaveTypeId`, `approverId` | Core business entity for absence management. |
| `LeaveType` | `id` (UUID) | `companyId` | Policy configuration for leave categories. |
| `ApprovalRule` | `id` (UUID) | `companyId`, `subjectRoleId`, `approverRoleId` | Defines workflow paths for requests. |
| `ApprovalStep` | `id` (UUID) | `leaveId`, `approverId`, `projectId`, `roleId` | Instance of a workflow execution step. |
| `Project` | `id` (UUID) | `companyId`, `clientId` | Tracks billable/non-billable work entities. |
| `Audit` | `id` (UUID) | `companyId`, `byUserId` | Generic change tracking (JSON diffs). |

## Actions & Services Inventory

### Server Actions (`lib/actions/`)
| Action | File | Purpose | Validation | Auth |
|--------|------|---------|------------|------|
| `signOutAction` | `auth.ts` | Terminate session. | - | Public |
| `createUser` | `user.ts` | Admin-only user creation. | Interface | Admin + Tenant |

### Core Services (`lib/services/`)
| Service | File | Key Patterns | Responsibility |
|---------|------|--------------|----------------|
| `ApprovalService` | `approval.service.ts` | Delegations, history. | Workflow engine queries and management. |
| `ConflictDetection` | `conflict-detection.service.ts` | Overlap logic. | Prevents double-booking of leaves. |
| `ProjectService` | `project-service.ts` | - | Project lifecycle management. |
| `NotificationService` | `notification.service.ts` | - | Dispatching system alerts. |

## Auth & Security
- **Engine:** Auth.js (NextAuth v5) using `@auth/prisma-adapter`.
- **Strategy:** Stateless JWT with 30-day expiry.
- **Session Context:** `id`, `firstName`, `lastName`, `companyId`, `isAdmin`.
- **RBAC:** 
  - `isAdmin`: Global flag for system administration.
  - Role-based: Handled via `Role` model and `ApprovalRule` engine.
- **Tenant Isolation:** Mandatory `companyId` filter on every DB query. Extract from `session.user.companyId`.

## Maintenance Policy
> [!IMPORTANT]
> This manifest MUST be updated after every schema change, new service creation, or action implementation. Failure to do so leads to architectural drift and token waste.

## Change Log
- **v1:** Initial generation. - 2026-02-06
