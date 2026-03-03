# Request Details Drawer Performance Analysis (Dashboard)

## Objective
Analyze why opening/closing the request details drawer on the dashboard takes up to ~4s (target <1s), identify bottlenecks and root causes, and define a remediation plan.

## Scope
- Route: `app/(dashboard)/page.tsx`
- Drawer trigger/state: `components/requests/view-button.tsx`, `components/requests/request-detail-sheet.tsx`
- Drawer UI: `components/ui/leave-details-drawer.tsx`
- Data paths executed on dashboard render: `lib/services/leave-request.service.ts`, `lib/allowance-service.ts`, `lib/leave-calculation-service.ts`
- Drawer details API: `app/api/leave-requests/[id]/route.ts`, `lib/rbac.ts`

## Baseline Symptom
- User interaction: open/close details drawer from dashboard.
- Observed latency: up to ~4s.
- Expected latency: <1s.

## Key Findings

### 1) Primary bottleneck: drawer open/close is coupled to URL navigation (full route re-render)
Evidence:
- Open action writes query param and navigates:
  - `components/requests/view-button.tsx:20-21`
- Close action removes query param and navigates:
  - `components/requests/request-detail-sheet.tsx:145-146`
- Drawer open state is derived from `useSearchParams()`:
  - `components/requests/request-detail-sheet.tsx:100,105-106`

Impact:
- Every open/close triggers App Router navigation because `requestId` changes in URL.
- Navigation causes server component re-execution of dashboard page data pipeline.
- Drawer responsiveness is gated by route transition work, not just local UI animation.

### 2) Heavy dashboard server work is re-run on every drawer toggle
Evidence in `app/(dashboard)/page.tsx`:
- Uses `searchParams` in server page signature (`requestId` included): `:22, :36`
- Recomputes KPI/data queries on render: `:45-49, :67, :74, :77`

Most expensive branch:
- `LeaveRequestService.getLeavesTakenYTD(user.id)` (`:48`)
- `lib/services/leave-request.service.ts:83-109`
  - Fetches approved leaves, then loops and calls `LeaveCalculationService.calculateLeaveDays(...)` per leave (`:101`)
- `lib/leave-calculation-service.ts:34-76,152+`
  - Per call: builds context, fetches schedule(s), fetches bank holidays.
- This creates an N+query pattern (N = number of approved leaves), potentially very costly.

Additional expensive branch:
- `AllowanceService.getAllowanceBreakdown(user.id, currentYear)` (`page.tsx:45`)
- `lib/allowance-service.ts:66+`
  - Loads user relations + consumption calculation + context building (`:120, :235, :284`).

Estimated query pressure per toggle (rough order):
- Base dashboard queries: multiple counts/findMany/findFirst + allowance path.
- `getLeavesTakenYTD`: 1 query for leaves + repeated context queries per leave.
- Effective DB roundtrips can grow significantly with historical data.

### 3) Drawer detail fetch has duplicate-request risk
Evidence:
- Click starts `prefetchRequest(requestId)` (async, fire-and-forget): `view-button.tsx:18`
- Drawer effect also fetches when opened if cache not ready yet:
  - `request-detail-sheet.tsx:128`
- Prefetch fetch is separate: `request-detail-sheet.tsx:91`

Impact:
- Under timing races, first open can issue 2 requests for same details endpoint.
- Not the primary 4s cause, but adds avoidable latency/load.

### 4) Details API has additional auth/user lookup overhead
Evidence:
- `app/api/leave-requests/[id]/route.ts:11` calls `getCurrentUser()`.
- `lib/rbac.ts:5-17` does `auth()` + `prisma.user.findUnique(include...)`.

Impact:
- Each details request performs auth/session + user DB lookup + request lookup with relations.
- Usually moderate, but contributes to end-to-end latency and contention.

## Root Cause Tree
1. UX state design issue:
- Drawer visibility is URL-param-driven (`requestId`) instead of local UI state.
2. Architectural coupling:
- URL mutation triggers server route navigation and recomputation of entire dashboard.
3. Data path inefficiency:
- Dashboard render includes expensive, repeated calculations and N+context DB work.
4. Secondary inefficiencies:
- Potential duplicate details fetches.
- Extra auth/user fetch on details endpoint.

## Why this produces ~4s behavior
- Opening/closing drawer is not a cheap client-side operation; it triggers server navigation.
- Navigation re-runs expensive dashboard data retrieval/calculation.
- Latency scales with user leave history (more approved leaves => more repeated calculations).
- The drawer operation inherits worst-case route render time, exceeding 1s target.

## Remediation Plan (Prioritized)

### P0: Decouple drawer interaction from route re-render
Goal: open/close should be immediate (<200ms perceived), independent of dashboard data reload.

Plan:
1. Make drawer open/close local client state (e.g., selected request id in a client container).
2. Keep URL sync optional and non-blocking:
- Either remove `requestId` from dashboard URL entirely, or
- Use URL update only after drawer visible and do not depend on server re-render to show drawer.
3. Ensure close action does not require route transition to hide UI.

Expected impact:
- Largest reduction in perceived latency for both open and close.

### P1: Reduce dashboard recomputation cost
Goal: even when route transitions happen (filters/pagination), keep server render fast.

Plan:
1. Remove per-leave repeated context building in `getLeavesTakenYTD`:
- Build calculation context once for the year range, reuse for all leaves.
2. Consolidate KPI queries where possible and avoid duplicate user loading.
3. Reuse/carry forward already-loaded user/context objects through service calls.
4. Review if some KPI values can be memoized/cached safely per user+day.

Expected impact:
- Significant reduction in backend latency and DB load.

### P2: Eliminate duplicate detail fetches
Goal: avoid redundant network/API work when opening drawer.

Plan:
1. Introduce in-flight request dedupe map keyed by `requestId`.
2. Make prefetch and open-fetch share the same promise/cache state.
3. Consider React Query/SWR for request detail cache + dedupe + stale handling.

Expected impact:
- Lower p95 open latency and backend load.

### P3: Optimize details API path
Goal: reduce per-request overhead.

Plan:
1. Minimize `getCurrentUser` include payload for this endpoint (load only required fields).
2. Review select/include on leave details query; avoid unneeded fields.
3. Add lightweight endpoint-level timing logs for auth/query breakdown.

Expected impact:
- Moderate latency reduction, better observability.

## Validation Plan
Measure before/after for:
1. Drawer open interaction-to-visible time (target <1s, ideally <300ms).
2. Drawer close interaction-to-hidden time (target <300ms).
3. Dashboard route transition time with and without `requestId` changes.
4. DB query count and total duration per open/close flow.
5. Duplicate API calls for `/api/leave-requests/:id` during first open.

Recommended instrumentation:
- Client marks: click/opened/closed timestamps.
- Server timings around dashboard render and key service calls.
- Query logging sampling in development/staging.

## Implementation Checklist

### Phase 1: UX decoupling (P0)
- [x] Introduce local drawer state container on dashboard client boundary.
- [x] Stop using `requestId` query param as source of truth for drawer visibility.
- [x] Keep optional deep-link handling without blocking immediate open/close.
- [x] Verify open/close works instantly without route transition dependency.

### Phase 2: Server performance (P1)
- [x] Refactor `getLeavesTakenYTD` to reuse one calculation context per request/year.
- [x] Remove repeated user/context fetches across allowance + KPI calls.
- [x] Audit and reduce redundant DB queries in dashboard render path.
- [ ] Benchmark dashboard render with large leave history datasets.

### Phase 3: Request detail fetch path (P2/P3)
- [ ] Add in-flight dedupe for request detail fetches.
- [ ] Unify prefetch/open fetch cache handling.
- [ ] Trim `getCurrentUser` payload for details endpoint.
- [ ] Add request timing logs for details API (auth/query/serialize).

### Phase 4: Verification and guardrails
- [ ] Add a performance test script/checklist for drawer open/close SLA.
- [ ] Define p50/p95 thresholds and track regressions in CI/staging.
- [ ] Document final architecture decision for drawer state management.

## Risk Notes
- If URL deep-linking to a specific request is a product requirement, maintain it as a secondary concern (hydrating initial drawer state) rather than as the live control for every toggle.
- Refactoring service-layer calculations requires careful parity checks for allowance/day calculations.

## Success Criteria
- Drawer open/close interactions consistently below 1s under normal dataset sizes.
- No full dashboard server rerender on simple drawer toggle.
- Reduced DB roundtrips and lower server time on dashboard navigations.
