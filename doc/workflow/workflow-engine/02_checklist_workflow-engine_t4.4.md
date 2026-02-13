# Checklist - Task 4.4
**Parent:** 02_detailed_m4_workflow-engine.md

### Steps
- [ ] Step 1: Integrate workflow engine runtime entrypoint in `app/api/leave-requests/route.ts` for request creation while preserving auto-approve shortcuts.
- [ ] Step 2: Update `app/api/leave-requests/[id]/approve/route.ts` to use aggregator-driven progression instead of direct sequence assumptions.
- [ ] Step 3: Update `app/api/leave-requests/[id]/reject/route.ts` to close active sub-flow branches consistently on rejection.
- [ ] Step 4: Align `app/api/approvals/bulk-action/route.ts` with runtime invariants so bulk decisions do not bypass sub-flow state rules.
- [ ] Step 5: Validate requester, approver, and watcher notifications are triggered only from final state transitions.

### Done When
- [ ] New leave requests initialize runtime-generated approval state correctly.
- [ ] Approve endpoint applies step/sub-flow progression through the runtime aggregator.
- [ ] Reject endpoint terminates runtime state consistently for all branches.
- [ ] Bulk actions follow the same runtime rules as single-request actions.
- [ ] Notifications and watcher dispatch happen only for valid final transitions.

## Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Checklist creation for Task 4.4 (LeaveRequest lifecycle integration). |
