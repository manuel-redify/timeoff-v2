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
- **LeaveRequestForm**: Updated to handle `userId` context, `forceCreate` override, and direct `status` selection for admins.

### Server Actions & API
- **getUserLeaveContext**: Server action in `lib/actions/user.ts` to fetch targeted user's allowance breakdown.
- **POST /api/leave-requests**: Enhanced to accept `forceCreate` and `status` overrides.

### Business Rules
| Rule | Logic |
| --- | --- |
| **Allowance Bypass** | If `forceCreate` is true and requester is Admin, validation skips balance check and logs the override when allowance is exceeded. |
| **Status Override** | Admin requests created for another employee default to `APPROVED`. Explicit `APPROVED` or `REJECTED` bypass workflow; explicit `NEW` stays pending and follows workflow routing. |
| **Audit Trail** | `leave_requests.byUserId` stores the actor, `userId` remains the target employee, and creation/override events are written to `Audit`. |

## Change Log
- **v1:** Initial implementation of Admin On-Behalf flow including allowance override and direct approval. - 2026-03-17
