# Workflow Engine Remediation Plan
**Status:** Proposed
**Source PRD:** `doc/prd/prd_workflow_engine.md`
**Scope:** Functional gaps, broken flows, PRD compliance, and performance hardening for Workflow Engine.

## 1. Objectives
1. Restore runtime correctness for multi-role and multi-context flow execution.
2. Close strict PRD compliance gaps in builder UX, validations, and lifecycle rules.
3. Stabilize tests and eliminate drift between implementation and test contracts.
4. Reduce runtime query overhead and verify the `< 200ms` tree generation target.

## 2. Priority Matrix

### P0 - Critical (Blocker)
1. Fix policy-context collapse so all valid role+context sub-flows are instantiated.
2. Fix resolver deduplication to preserve policy/sub-flow boundaries.
3. Make sequence/parallel persistence deterministic and runtime-safe.
4. Prevent creation of pending approval steps when runtime outcome is immediate `APPROVED`.
5. Ensure workflow audit events are written for final approval path.

### P1 - High
1. Align department trigger matching (ID vs name mismatch).
2. Enforce policy-change audit trail for save/duplicate/delete actions.
3. Enforce request immutability policy consistently (delete+recreate or revised PRD-aligned semantics).
4. Enforce full watcher-vs-approver priority consistently at submission/runtime.
5. Close strict UI/validation gaps from PRD section 8.

### P2 - Medium
1. Harden performance with query reductions and instrumentation.
2. Clean legacy/dead paths and outdated helper methods in resolver.
3. Add regression coverage for known bug classes and PRD acceptance criteria.

## 3. Workstreams

### Workstream A: Runtime Correctness (P0)
1. Replace workflow-level dedupe with context-aware policy instance generation.
2. Persist explicit step `sequence` and `parallelGroupId` in workflow rules; stop deriving sequence from synthetic IDs.
3. Deduplicate resolvers by composite key (`policyId`, `step`, `userId`) instead of `userId` only.
4. For `AUTO_APPROVED` runtime outcomes, avoid creating pending `approval_steps`.
5. Ensure advanced-mode approve path always writes audit for both intermediate and final outcomes.

**Deliverables**
1. Updated `WorkflowResolverService` matching and sub-flow building.
2. Updated request creation/approval lifecycle behavior.
3. New tests for multi-context sub-flow explosion and outcome integrity.

### Workstream B: PRD Compliance (P1)
1. Fix trigger field semantics:
   - Department matching by ID (or normalize options+matching coherently).
   - Contract Type field behavior aligned to PRD-required `Select` semantics.
2. Builder validation:
   - Enforce at least one approver step.
   - Enforce resolver requirement unless step is truly non-blocking auto-approve mode.
3. Builder UI strictness:
   - Edit-mode skeleton blocks for Triggers/Sequence/Watchers.
   - Required table columns (`Triggers/Applies To`) and exact action patterns.
   - Restore/implement step ordering affordances per PRD (if retained as strict requirement).
4. Lifecycle compliance:
   - Standardize immutability behavior and update endpoints accordingly.

**Deliverables**
1. PRD coverage checklist with explicit pass/fail per requirement.
2. Updated builder/list behavior and matching validations.

### Workstream C: Auditing & Governance (P1)
1. Add workflow policy CRUD audit events (`create/update/duplicate/delete`).
2. Ensure all override actions (approve/reject, single and bulk) produce consistent audit payloads.
3. Add traceability for fallback activation per step/sub-flow.

**Deliverables**
1. Extended `WorkflowAuditService` events and call sites.
2. Test suite for audit event completeness and payload shape.

### Workstream D: Testing Stabilization (P1/P2)
1. Update outdated tests still mocking removed models (`approvalRule`, `watcherRule` patterns).
2. Convert fragile string-presence tests to behavior assertions where possible.
3. Add regression tests for:
   - Multi-role + multi-project additive union.
   - Step sequence/parallel deterministic ordering.
   - Auto-approval with no pending steps.
   - Final approval audit write path.
   - Watcher/approver precedence.

**Deliverables**
1. Green workflow test suites in CI.
2. Reduced brittle source-string assertions.

### Workstream E: Performance (P2)
1. Add instrumentation around:
   - `findMatchingPolicies`
   - `generateSubFlows`
   - total request routing time in create endpoint
2. Reduce query count by:
   - batching role/scope lookups,
   - caching per-request entity maps,
   - avoiding repeated per-step DB fetches for same scopes.
3. Set acceptance gate: p95 approval-tree generation `< 200ms` on representative dataset.

**Deliverables**
1. Perf baseline and after-fix report.
2. Runtime safeguards (logs/metrics) for regression detection.

## 4. Execution Plan

### Phase 1 (P0 First - 2 to 4 days)
1. Implement Workstream A changes.
2. Add/adjust tests required to prove corrected runtime semantics.
3. Validate no regressions in approval/rejection/bulk-action flows.

### Phase 2 (P1 - 2 to 3 days)
1. Implement Workstream B and C.
2. Finalize PRD compliance checklist and resolve all high-priority deviations.
3. Stabilize policy-management and builder tests.

### Phase 3 (P2 - 1 to 2 days)
1. Implement Workstream E optimizations and instrumentation.
2. Produce performance validation report and close residual risks.

## 5. Acceptance Criteria
1. Multi-role + multi-context matrix behavior matches PRD 4.1/4.3 with deterministic sub-flow generation.
2. No pending `approval_steps` exist when request is persisted as `APPROVED` from workflow runtime.
3. Audit records are complete for create/approve/reject/override/bulk/policy CRUD.
4. Builder/list pages satisfy PRD section 8 mandatory requirements or documented approved deviations.
5. Workflow-related tests pass with no known flaky/brittle failures.
6. Performance report demonstrates `< 200ms` generation target at p95 (or includes approved mitigation plan if unmet).

## 6. Risks & Mitigations
1. **Risk:** Behavior changes may affect existing requests in-flight.
   **Mitigation:** Feature-flag critical runtime changes and validate on staging with snapshot data.
2. **Risk:** Historical data lacks explicit sequence semantics.
   **Mitigation:** Add migration/normalization fallback for legacy workflow payloads.
3. **Risk:** Strict PRD UI updates may conflict with current UX assumptions.
   **Mitigation:** Lock requirement interpretation with product before final UI pass.

## 7. Recommended Immediate Next Step
1. Start Phase 1 with a focused patch on `WorkflowResolverService` policy-context expansion + resolver dedup fix, then run workflow runtime tests before touching UI.

## 8. Execution Checklist
**How to use this section**
1. Keep each task as a single source of truth for execution status.
2. When a task is completed, switch `[ ]` to `[x]`.
3. If a task is intentionally deferred, append `(Deferred)` and short reason.
4. If scope changes, add a new item rather than rewriting historical completion.

### Phase 1 - Runtime Correctness (P0)
- [x] A1. Replace workflow-level deduplication with context-aware policy instance generation.
- [x] A2. Ensure all valid role+context combinations produce independent sub-flows.
- [x] A3. Persist explicit `sequence` in workflow payload instead of deriving from synthetic IDs.
- [x] A4. Preserve and persist `parallelGroupId` deterministically.
- [x] A5. Update resolver dedup key to (`policyId`, `step`, `userId`) and remove cross-policy collapse.
- [x] A6. Prevent pending `approval_steps` creation when runtime outcome is immediate `APPROVED`.
- [x] A7. Ensure final-approval branch writes workflow audit events before return.
- [x] A8. Add regression tests for multi-context sub-flow expansion.
- [x] A9. Add regression tests for deterministic sequence/parallel ordering.
- [x] A10. Add regression tests for `AUTO_APPROVED` requests without pending steps.
- [x] A11. Add regression tests for final approval audit persistence.
- [x] A12. Run workflow runtime test suites and confirm green.

### Phase 2 - PRD Compliance & Governance (P1)
- [x] B1. Normalize department trigger matching (ID vs name) across options, storage, and runtime matching.
- [x] B2. Align contract type control behavior with PRD requirement (`Select` semantics).
- [x] B3. Enforce validation: at least one approver step required.
- [x] B4. Enforce resolver requirement unless step is valid non-blocking auto-approve mode.
- [x] B5. Add edit-mode skeleton blocks for Triggers/Sequence/Watchers.
- [x] B6. Add/restore required overview columns including `Triggers / Applies To`.
- [x] B7. Confirm/implement required step ordering controls per PRD (arrows or approved equivalent).
- [x] B9. Remove redundant step move arrows and keep drag-and-drop as the single ordering control.
- [x] B10. Resolve `Triggers / Applies To` table values to human-readable labels (no raw UUIDs).
- [x] B11. Enforce workflow-step progression in approve/reject APIs whenever workflow approval steps exist (even if `company.mode=1`).
- [x] B12. De-duplicate repeated approver rows in request detail workflow timeline (same approver + same sequence).
- [x] B13. Force-refresh workflow step editor module identity to recover from Turbopack stale icon HMR graph.
- [x] B8. Decide and implement canonical immutability behavior (`delete+recreate` vs approved revised behavior).
- [x] C1. Add policy CRUD audit events (`create`, `update`, `duplicate`, `delete`).
- [x] C2. Ensure override and fallback audit events are complete in single and bulk flows.
- [x] C3. Add/extend tests for audit payload consistency and event completeness.
- [x] D1. Update outdated tests mocking removed/legacy models.
- [x] D2. Replace brittle source-string assertions with behavior-level assertions where feasible.
- [x] D3. Run policy-management, role-resolution, and audit test suites and confirm green.

### Phase 3 - Performance Hardening (P2)
- [x] E1. Add timing instrumentation for `findMatchingPolicies`.
- [x] E2. Add timing instrumentation for `generateSubFlows`.
- [x] E3. Add end-to-end routing timing in leave request creation path.
- [x] E4. Reduce repeated DB calls by batching role/scope lookups.
- [x] E5. Add per-request caching for repeated resolver/scope computations.
- [x] E6. Benchmark representative dataset and capture p50/p95.
- [x] E7. Validate p95 approval-tree generation `< 200ms` or document approved mitigation.

### Cross-Cutting Validation
- [x] V1. Build a PRD requirement coverage matrix (requirement -> implemented code -> test proof).
- [x] V2. Verify watcher vs approver priority behavior in submission and notification paths.
- [x] V3. Verify rejection in any sub-flow forces master `REJECTED`.
- [x] V4. Verify approval requires all sub-flows complete.
- [x] V5. Verify no regressions in bulk approve/reject workflow behavior.
- [x] V6. Perform final documentation pass with open risks and decisions logged.

### Completion Gates
- [x] G1. Phase 1 complete (all A-items checked).
- [x] G2. Phase 2 complete (all B/C/D-items checked).
- [x] G3. Phase 3 complete (all E-items checked).
- [x] G4. Validation complete (all V-items checked).
- [x] G5. Remediation closed and ready for sign-off.

## 9. PRD Coverage Matrix
| PRD Requirement | Implementation Status | Evidence |
|---|---|---|
| 4.1 Additive policy matching (union) | Completed | `WorkflowResolverService.findMatchingPolicies` now emits per role+context policy instances |
| 4.3 Multi-project/multi-role matrix sub-flows | Completed | `generateSubFlows` + runtime tests for independent sub-flows |
| 4.4 Self-approval skipped | Completed | `applySelfApprovalSafety`, runtime tests |
| 4.5 Watcher/Approver priority | Completed | `WatcherService.notifyWatchers` filters pending approvers + `watcher-priority` test |
| 4.6 Fallback safety net | Completed | fallback resolution in resolver + fallback audit events |
| 4.7 Request immutability | Completed (delete+recreate policy) | remove/new-only semantics in leave-request delete/cancel routes |
| 4.8 Reject in any sub-flow rejects master | Completed | `aggregateOutcome` and reject endpoint tests |
| 4.9 Admin override + audit | Completed | single/bulk routes + override audit tests |
| 7 Audit trail for policy changes | Completed | save/duplicate/delete actions write workflow audit events |
| 7 Performance `<200ms` generation | Completed (fixture benchmark) | instrumentation + benchmark test (`p50/p95`) with threshold assertion |
| 8 Builder validation (resolver + min steps) | Completed | `workflowSchema` strict step validation |
| 8 Overview/Builder UX strictness (major items) | Completed | triggers/applies-to, edit skeletons, DnD ordering control, contract select |

## 10. Decisions & Risks Log
1. **Decision:** Workflow policy evaluation remains fully dynamic and data-driven from `workflow.rules` (no hardcoded policy graph).
2. **Decision:** Immutability enforced as remove-and-recreate for pending requests; approved requests require revoke flow.
3. **Decision:** Resolver deduplication is scoped by `policyId+step+userId` to preserve independent sub-flow approvals.
4. **Risk:** Existing clients relying on old cancel behavior for approved requests may need UI messaging alignment.
5. **Risk:** Benchmark is fixture-based in CI; production-like data benchmarking should still be run in staging.
6. **Decision:** Step ordering UX is standardized on drag-and-drop; move up/down arrows removed as redundant.
