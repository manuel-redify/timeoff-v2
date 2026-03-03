# Leave Request Submission Performance Analysis

## 1. Context and Objective
- User-reported symptom: submitting a leave request takes several seconds.
- Expected target: end-user perceived completion under 1 second.
- Scope analyzed: full `POST /api/leave-requests` execution path from request receive to HTTP response.

## 2. Methodology
- Static code-path analysis of the request lifecycle and transitive service calls.
- Query-shape and call-count analysis (including fan-out and N+1 behavior).
- Review of existing performance instrumentation and benchmark tests.
- No production tracing data was available in this run, so latency magnitudes below are reasoned from call structure and synchronous waits.

## 3. Critical Path Mapping (Current Behavior)
Primary endpoint:
- `app/api/leave-requests/route.ts:16`

Synchronous phases in current path:
1. Authentication and current-user load (`requireAuth` -> `getCurrentUser`)  
   - `lib/api-auth.ts`, `lib/rbac.ts`
2. Full validation pipeline (business + overlap + allowance + leave-type limit)  
   - `app/api/leave-requests/route.ts:32` -> `lib/leave-validation-service.ts:25`
3. Workflow routing and runtime generation (for non-auto-approved requests)  
   - `app/api/leave-requests/route.ts:96`, `:104` -> `lib/services/workflow-resolver-service.ts:27`, `:506`
4. Transaction for request + approval steps + audit events  
   - `app/api/leave-requests/route.ts` transaction block
5. Notification dispatch is awaited before response return  
   - `app/api/leave-requests/route.ts:242`, `:285`, `:295`, `:322`
6. Response returned only after all above complete.

## 4. Bottlenecks and Root Causes

## 4.1 Primary Bottleneck: Synchronous Notification/Email Dispatch on the Request Path
Evidence:
- Notification fan-out is awaited (`Promise.all` completion required) before returning API response.
- `app/api/leave-requests/route.ts:285` (approver/watcher notifications)
- Auto-approved path performs sequential waits (`notify` then `notifyWatchers`): `app/api/leave-requests/route.ts:304` onward.
- Notification internals include DB reads/writes plus potential external SMTP call:
  - preference lookup: `lib/services/notification.service.ts`
  - in-app insert: `notification.create`
  - optional email render + remote SMTP API + email audit insert.

Why this is slow:
- External SMTP round trips are network-bound and unpredictable.
- Recipient fan-out multiplies total work per submission.
- Response is blocked on non-critical side effects.

Impact assessment:
- High confidence this alone can push request latency from sub-second to multi-second when email is enabled or many recipients/watchers exist.

Root cause:
- Architectural coupling of user-facing write path with asynchronous notification side effects.

## 4.2 Secondary Bottleneck: Validation Path Contains Heavy, Repeated Calculations (N+1)
Evidence:
- Validation invokes:
  - leave-day calculation: `lib/leave-validation-service.ts:93`
  - overlap detection: `:163`
  - allowance breakdown: `:116`
  - leave-type annual limit usage: `:247`
- `LeaveCalculationService.calculateLeaveDays` performs multiple DB reads per call (`user`, `schedule`, `bankHoliday`): `lib/leave-calculation-service.ts:24`.
- `AllowanceService.calculateConsumption` loops through historical leaves and calls `calculateLeaveDays` for each leave (`N` times): `lib/allowance-service.ts:197`, `:226`.
- Leave-type limit calculation also loops over leaves and calls `calculateLeaveDays` repeatedly (`N` times): `lib/leave-validation-service.ts:263`.

Why this is slow:
- Repeated per-leave database reads create multiplicative query load.
- Longer history users are penalized more (latency grows with number of past requests).

Impact assessment:
- Medium to High depending on user history and leave policy setup.
- Likely contributes hundreds of milliseconds to multiple seconds for heavy-history users.

Root cause:
- Recomputing day counts from scratch using DB-dependent method inside loops instead of prefetching/caching or set-based aggregation.

## 4.3 Tertiary Bottleneck: Workflow Resolution Complexity and Query Chattiness
Evidence:
- Policy matching expands contexts for all active projects if no specific project provided: `lib/services/workflow-resolver-service.ts:82` onward.
- Workflow lookup relies on JSON-path filtering over `workflow.rules` (`requestTypes`): `:113`.
- Subflow generation resolves steps/watchers with multiple dynamic DB lookups (`userProject`, `user`, `departmentSupervisor`, etc.) across policies/steps/scopes.

Why this is slow:
- Context explosion (projects x policies x steps/watchers).
- JSON path filters are often slower than normalized relational predicates unless indexed carefully.
- Cache exists, but many key shapes still produce repeated queries under varied scopes.

Impact assessment:
- Medium and workload-dependent.
- Can be significant in organizations with many active projects/workflows.

Root cause:
- High-flexibility runtime evaluation model still sits directly on synchronous request path.

## 4.4 Additional Latency Multipliers
1. Redundant reads in same request:
- leave type loaded in validation, then fetched again in route.
- user loaded via auth, then loaded again with contract/company include.

2. Very verbose logging in hot path:
- Frequent `console.log` with payloads in `notification.service.ts`; adds overhead and log I/O pressure.

3. Benchmark/guardrail gap:
- Existing workflow benchmark test currently fails due outdated mock shape (`findUnique` missing): `tests/workflow/workflow-performance-benchmark.test.ts`.
- Result: no reliable automated guardrail against runtime regression.

## 5. Bottleneck Ranking (By Expected Real Impact)
1. Synchronous notification/email dispatch on critical path (highest).
2. Validation N+1 (allowance + leave-type limit) with repeated DB-bound day calculations.
3. Workflow resolver runtime complexity for multi-project/multi-policy tenants.
4. Redundant reads and logging overhead.

## 6. Why the 1-Second Target Is Missed
Even if DB writes are fast, the API currently waits for:
- deep validation, then
- dynamic workflow expansion, then
- notification fan-out that may include remote SMTP.

This stacks multiple variable-latency phases into one blocking request. The design optimizes functional completeness in a single transaction-like flow, but not response-time isolation.

## 7. Remediation Plan

## Phase 0 (Immediate, highest ROI)
Goal: decouple user response time from non-critical side effects.

1. Make notifications asynchronous (queue/event/outbox), return response immediately after durable leave-request persistence.
2. Keep reliable delivery semantics with retry + dead-letter handling.
3. Add idempotency key per notification event to avoid duplicate sends.

Expected result:
- Largest reduction in p95 latency (often seconds -> sub-second range).

## Phase 1 (Validation Cost Reduction)
Goal: remove N+1 and repeated data fetches.

1. Prefetch user/schedule/holiday context once per request and reuse in all day computations.
2. Replace per-leave `calculateLeaveDays` loops with batched/set-based strategies where possible.
3. Cache leave-day calculations within request scope for repeated date intervals.
4. Eliminate duplicate reads (leaveType/user) in route after validation.

Expected result:
- Stabilize latency across users with larger leave history.

## Phase 2 (Workflow Runtime Optimization)
Goal: reduce workflow resolution cost and variance.

1. Profile `findMatchingPolicies` and `generateSubFlows` with per-substep timers and query counts.
2. Normalize or pre-index workflow trigger fields currently stored in JSON for frequent filters.
3. Reduce scope-resolution query count through stronger memoization and batched role/project lookups.
4. Consider precomputed resolver snapshots for common contexts if policy churn is low.

Expected result:
- Lower p95/p99 for complex orgs with many projects and workflow policies.

## Phase 3 (Operational Hardening)
1. Reduce hot-path log verbosity; keep structured, sampled logs for performance events only.
2. Repair and enforce benchmark/perf tests in CI.
3. Add SLO alarms for submission endpoint latency and notification backlog depth.

## 8. Instrumentation Plan (Required Before/After Verification)
Track these timers in a single trace/span per request:
- `auth_ms`
- `validation_total_ms`
- `validation_calculate_days_ms`
- `validation_allowance_ms`
- `workflow_find_policies_ms`
- `workflow_generate_subflows_ms`
- `db_transaction_ms`
- `notification_enqueue_ms` (target near-zero after decoupling)
- `total_request_ms`

Also collect:
- DB query count per request
- Notification recipients count per request
- SMTP send latency (off-request worker)

## 9. Success Criteria
1. `POST /api/leave-requests` p95 < 1000 ms with notifications enabled.
2. p99 stable under expected peak with no multi-second spikes from email provider latency.
3. Functional parity maintained (all notifications delivered, auditable, idempotent).
4. Validation and workflow paths have bounded query counts and no history-driven N+1 growth.

## 10. Implementation Order Recommendation
1. Asynchronous notification decoupling (highest impact, lowest product risk).
2. Validation N+1 reduction and request-scope caching.
3. Workflow trigger/query optimization and normalization.
4. CI benchmark repair + SLO monitoring rollout.

## 11. Notes and Constraints
- This report is based on code-level analysis of current implementation and available test assets.
- Production APM/trace data should be collected to confirm exact per-phase timings and finalize prioritization percentages, but root-cause hierarchy is already strong enough to start remediation.

## 12. Execution Checklist
How to use:
1. Change `[ ]` to `[x]` when a task is complete.
2. If deferred, append `(Deferred)` with a short reason.
3. Add new items instead of rewriting completed history.

### Phase 0 - Async Notifications (Highest ROI)
- [x] P0.1 Define async delivery architecture (queue/event bus/outbox) and failure semantics.
- [x] P0.2 Add durable notification event persistence at leave request creation time.
- [x] P0.3 Move notification send logic out of request path into worker/consumer.
- [x] P0.4 Implement retries, backoff, and dead-letter handling.
- [x] P0.5 Add idempotency keys to prevent duplicate sends.
- [x] P0.6 Keep auditability for notification lifecycle (queued/sent/failed).
- [x] P0.7 Validate functional parity for approvers/watchers/requester notifications.
- [x] P0.8 Measure before/after endpoint p50/p95/p99 and document results.

### Phase 1 - Validation Cost Reduction
- [ ] P1.1 Prefetch and reuse user/schedule/holiday context within one request.
- [ ] P1.2 Remove repeated DB-dependent day calculations inside per-leave loops.
- [ ] P1.3 Introduce request-scope memoization for repeated leave-day calculations.
- [ ] P1.4 Refactor allowance consumption computation to reduce query count and N+1 behavior.
- [ ] P1.5 Refactor leave-type limit usage computation to avoid repeated heavy calls.
- [ ] P1.6 Remove duplicate leaveType/user fetches between validation and route handler.
- [ ] P1.7 Add/adjust tests for validation correctness after optimization.
- [ ] P1.8 Capture query-count and latency deltas after implementation.

### Phase 2 - Workflow Runtime Optimization
- [ ] P2.1 Add detailed substep timers and query counters in workflow resolver path.
- [ ] P2.2 Profile context explosion scenarios (many projects, policies, steps, watchers).
- [ ] P2.3 Optimize policy matching/filtering strategy for request-type triggers.
- [ ] P2.4 Reduce repeated scope-resolution queries via stronger batching/memoization.
- [ ] P2.5 Evaluate and implement normalized/indexed trigger fields where needed.
- [ ] P2.6 Add performance regression tests for high-complexity workflow fixtures.
- [ ] P2.7 Verify workflow correctness is unchanged after performance refactors.
- [ ] P2.8 Re-run benchmarks and publish updated p50/p95/p99.

### Phase 3 - Operational Hardening
- [ ] P3.1 Reduce hot-path log verbosity in notification and submit flow.
- [ ] P3.2 Repair workflow performance benchmark test and CI execution.
- [ ] P3.3 Add SLO dashboards/alerts for `POST /api/leave-requests` latency.
- [ ] P3.4 Add alerts for notification backlog depth and delivery failure rates.
- [ ] P3.5 Add runbook for degraded notification provider scenarios.
- [ ] P3.6 Confirm production observability covers all key timers listed in Section 8.

### Cross-Cutting Validation Gates
- [ ] V1 End-to-end submission p95 is below 1000ms.
- [ ] V2 p99 no longer exhibits multi-second spikes from notification delivery path.
- [ ] V3 Notification reliability and idempotency validated under retry/failure tests.
- [ ] V4 Query-count growth is bounded for heavy-history users.
- [ ] V5 No regressions in workflow routing/outcome behavior under load.
- [ ] V6 Final sign-off document published with metrics and residual risks.
