# PRD Analysis - Dashboard KPI Fix
**Version:** v1
**Date:** 2026-03-04
**Source PRD:** `doc/prd/prd_user_dashboard.md`

## 🎯 Objective
Fix the `LeavesTakenCard` in the dashboard which currently shows incorrect (zero) values. The root cause is a casing mismatch: the code uses uppercase literals (e.g., `'APPROVED'`) while the database and generated Prisma types use lowercase (e.g., `'approved'`).

| ID  | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | User | Leaves Taken KPI | Show total days for approved requests. **Source of Truth:** Should use `durationMinutes` divided by `minutesPerDay`. | Fallback to date-based calculation if `durationMinutes` is 0 (legacy data). |
| F02 | System | Data Consistency | Use `LeaveStatus` and `DayPart` enums. Fix `'APPROVED'` (code) vs `'approved'` (DB) mismatch. | Ensure all service queries are case-insensitive or use the correct enum values. |
| F03 | System | Duration Persistence | The API route (`POST /api/leave-requests`) must calculate and save `durationMinutes` into the DB. | Use `LeaveCalculationService.calculateDurationMinutes` before calling `prisma.create`. |

## 🏗️ Data Entities (Domain Model)
- **LeaveRequest:** Status field uses `LeaveStatus` enum (`new`, `approved`, `rejected`, etc.).
- **LeaveType:** `useAllowance` flag determines if a request counts towards the KPI.

## 🔗 Dependencies & Blockers
- **Internal:** Relies on `LeaveCalculationService` for accurate day counts (excluding weekends/holidays).
- **External:** None.

## 🔧 Technical Stack & Constraints
- **Stack:** Next.js, Prisma, PostgreSQL.
- **Constraints:** Must follow the case-sensitive mapping in `schema.prisma`.

## 🚫 Scope Boundaries
- **In-Scope:** Fixing casing in `LeaveRequestService`, `AllowanceService`, and verifying dashboard display.
- **Out-of-Scope:** Changing the overall dashboard layout or adding new features.

## ❓ Clarifications Needed
- None at this stage. Root cause is confirmed.

### 4. Output Persistence & Workflow
**Path:** `doc/workflow/dashboard-kpi-fix/01_prd_analysis_dashboard-kpi-fix_v1.md`
