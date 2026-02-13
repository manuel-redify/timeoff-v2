# Detailed Phase - Milestone 4: Execution Engine (The "Matrix" Runtime)
**Parent:** `doc/workflow/workflow-engine/02_task_plan_workflow-engine.md`
**Files Involved:** `lib/services/workflow-resolver-service.ts`, `lib/types/workflow.ts`, `lib/approval-routing-service.ts`, `app/api/leave-requests/route.ts`, `app/api/leave-requests/[id]/approve/route.ts`, `app/api/leave-requests/[id]/reject/route.ts`, `app/api/approvals/bulk-action/route.ts`, `lib/services/notification.service.ts`, `lib/services/watcher.service.ts`, `lib/prisma.ts`, `tests/workflow/workflow-engine-runtime.test.ts` [NEW]

### Task 4.1: Implement Policy Matching logic (User Role + Project Roles + "Any")
**Effort:** Large
1. [x] Define effective role resolution strategy in `lib/services/workflow-resolver-service.ts` to collect default role + active project roles for the requester context.
2. [x] Implement additive UNION matching across `ApprovalRule` and `WatcherRule` for request type + role + optional project constraints, including explicit "Any" behavior.
3. [x] Add deterministic policy grouping key generation to avoid duplicate policy materialization from overlapping rule matches.
4. [x] Add safety filtering for inactive/deleted entities before final policy set emission.
5. [x] Add targeted unit tests for role-union and "Any" matching scenarios in `tests/workflow/workflow-engine-runtime.test.ts`.

### Task 4.2: Develop Sub-Flow generation logic (instantiate parallel trees per context)
**Effort:** Large
1. [x] Extend runtime types in `lib/types/workflow.ts` to model Sub-Flow identity, step state, and role/context origin.
2. [x] Implement sub-flow builder in `lib/services/workflow-resolver-service.ts` that instantiates independent flows per matched policy-role context.
3. [x] Support mixed sequential and parallel steps while preserving deterministic execution order for equal sequence values.
4. [x] Apply self-approval skip rules and fallback injection during sub-flow build (not only during final resolver flattening).
5. [x] Add test fixtures covering multi-policy and multi-project-role requests with parallel sub-flow generation.

### Task 4.3: Build Outcome Aggregator (Approved if ALL Sub-Flows Approved, Rejected if ANY Rejects)
**Effort:** Medium
1. [ ] Implement aggregator utility in `lib/services/workflow-resolver-service.ts` that computes master status from sub-flow and step-level states.
2. [ ] Encode terminal rules: `REJECTED` if any sub-flow rejects; `APPROVED` only when all required steps in all sub-flows approve.
3. [ ] Add handling for skipped/auto-approved steps so they close without blocking finalization.
4. [ ] Ensure aggregator output maps to existing leave status semantics used in API routes.
5. [ ] Add focused tests for pending/approved/rejected transitions across multiple sub-flows.

### Task 4.4: Integrate Engine into the `LeaveRequest` creation/update lifecycle
**Effort:** Large
1. [ ] Integrate runtime entrypoint into `app/api/leave-requests/route.ts` (create) while preserving current auto-approve shortcuts.
2. [ ] Replace direct advanced-mode sequencing assumptions in `app/api/leave-requests/[id]/approve/route.ts` with aggregator-driven progression.
3. [ ] Ensure rejection handling in `app/api/leave-requests/[id]/reject/route.ts` updates all active sub-flow branches consistently.
4. [ ] Align bulk operations in `app/api/approvals/bulk-action/route.ts` with runtime invariants to prevent bypassing sub-flow state.
5. [ ] Validate notification/watcher dispatch still triggers from final state transitions only.

### Task 4.5: Implement Audit logging for Engine decisions and Admin Overrides
**Effort:** Medium
1. [ ] Define canonical audit attributes for policy matching, fallback activation, aggregator outcome, and override actions.
2. [ ] Add transaction-scoped `audit.create` or `audit.createMany` calls in create/approve/reject/bulk routes for all runtime decisions.
3. [ ] Record admin force-approve/force-reject actions with explicit override metadata (actor, reason/comment, previous state).
4. [ ] Ensure audit records include `entityType`, `entityId`, `companyId`, and `byUserId` for traceability and reporting.
5. [ ] Add verification tests/assertions for audit event emission in normal and override paths.

## Next Steps
- Create Task Checklist files for 4.1 through 4.5 (`02_checklist_workflow-engine_t4.X.md`).
- Execute Task 4.1 first and update this file and `doc/workflow/workflow-engine/02_task_plan_workflow-engine.md` in real time.
- Mark completed tasks with `[x]` and record any structural re-planning in the change log.

## Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-13 | 1.0 | Initial Milestone 4 detailed breakdown created from PRD and current runtime code. |
| 2026-02-13 | 1.1 | Task 4.1 completed (policy matching, Any handling, dedupe grouping, inactive filtering, unit tests). |
| 2026-02-13 | 1.2 | Task 4.2 completed (sub-flow runtime types, builder, deterministic ordering, safety/fallback handling, tests). |
