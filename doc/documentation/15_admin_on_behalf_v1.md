# Admin On-Behalf Flow
**Latest Version:** v1 | **Date:** 2026-03-17
**Parent:** [00_doc_master.md](00_doc_master.md) | **Dependencies:** [14_workflow_engine_v1.md](14_workflow_engine_v1.md)

## TL;DR (3 lines max)
> **AI Instruction:** Read ONLY this TL;DR. If NOT relevant to the current task, stop reading the file immediately to save tokens.
Allows administrators to create leave requests for any employee, optionally bypassing allowance limits and workflow approvals via direct status overrides.

## Overview
This feature introduces a privileged flow for administrators to manage absences on behalf of others. It integrates with the search service to select employees and the allowance service to provide real-time balance context.

## Technical Details

### Frontend Components
- **EmployeeCombobox**: Searchable dropdown for user selection (`components/requests/employee-combobox.tsx`).
- **LeaveRequestForm**: Updated to handle `userId` context, `ignoreAllowance` flag, and direct `status` selection for admins.

### Server Actions & API
- **getUserLeaveContext**: Server action in `lib/actions/user.ts` to fetch targeted user's allowance breakdown.
- **POST /api/leave-requests**: Enhanced to accept `ignoreAllowance` and `status` overrides.

### Business Rules
| Rule | Logic |
| --- | --- |
| **Allowance Bypass** | If `ignoreAllowance` is true and requester is Admin, validation skips balance check. |
| **Status Override** | If `status` is provided by Admin, request is created with that status, bypassing `WorkflowResolverService`. |
| **Audit Trail** | `byUserId` captures the Admin's ID while `userId` remains the target employee. |

## Change Log
- **v1:** Initial implementation of Admin On-Behalf flow including allowance override and direct approval. - 2026-03-17
