# Detailed Phase - Milestone 1: Database & Backend Core

**Parent:** 02_task_plan_period_management_leave_request.md
**Files Involved:** 
- `prisma/schema.prisma`
- `lib/leave-calculation-service.ts`
- `lib/services/leave-request.service.ts`

## Task 1.1: Database Migration for Timestamp Storage

1. [x] **Add `durationMinutes` field to LeaveRequest model**
   - Add `durationMinutes Int @default(0) @map("duration_minutes")` to schema
   - Add index for querying by duration

2. [x] **Update `dateStart` and `dateEnd` to full DateTime**
   - Remove `@db.Date` from both fields in schema
   - Create migration to convert existing dates

3. [x] **Add `minutesPerDay` field to Company model**
   - Add `minutesPerDay Int @default(480) @map("minutes_per_day")` for 8h standard

4. [x] **Generate Prisma client and run migration**
   - `npx prisma generate`
   - `npx prisma db push`

**Effort:** L

## Task 1.2: Duration Minutes Calculation Logic

1. [x] **Implement `calculateDurationMinutes` function**
   - Created in `lib/leave-calculation-service.ts`
   - Input: startDate, dayPartStart, endDate, dayPartEnd, schedule
   - Output: total minutes as integer

2. [x] **Add preset time constants**
   - Added DEFAULT_WORK_START_HOUR = 9
   - Added DEFAULT_WORK_END_HOUR = 18
   - Added DEFAULT_MORNING_END_HOUR = 13
   - Added DEFAULT_AFTERNOON_START_HOUR = 14

3. [x] **Handle custom time range**
   - Accept explicit startTime and endTime parameters
   - Calculate minutes from explicit times using date-fns

4. [x] **Write unit tests for calculation**
   - Test all presets (ALL, MORNING, AFTERNOON)
   - Test custom ranges
   - Edge cases (same start/end time, invalid time)
   - Multi-day calculations
   - Holiday/weekend exclusion

**Effort:** M

## Task 1.3: Working Days Calculation (Minutes)

1. [x] **Extend `calculateLeaveDaysWithContext`**
   - Added parameter for returning minutes instead of days
   - Uses `context.minutesPerDay` for conversion

2. [x] **Update multi-day iteration logic**
   - Calculate working minutes per day based on schedule
   - Skip weekends/holidays properly

3. [x] **Handle partial days correctly**
   - Morning/Afternoon presets calculate half day minutes
   - Custom times calculate exact minutes

4. [x] **Integration test with real schedules**
   - Implemented with schedule-based calculations

**Effort:** M

## Task 1.4: Overlap Prevention Validation

1. [x] **Create `checkOverlap` function in LeaveRequestService**
   - Input: userId, dateStart, dateEnd, excludeRequestId (optional)
   - Query: Find existing approved/new requests with overlapping date ranges
   - Return: { hasOverlap: boolean, overlappingRequests: LeaveRequestWithRelations[] }

2. [ ] **Add overlap check in leave creation flow**
   - Called before creating leave request
   - Throw error if overlap found

3. [x] **Handle edge cases**
   - Same day requests with different times
   - Multi-day overlapping with single-day
   - Partial overlap detection

**Effort:** S

## Task 1.5: Allowance Validation (Non-blocking Warning)

1. [x] **Add `checkAllowance` function**
   - Input: userId, durationMinutes, year (optional)
   - Output: { isExceeded: boolean, remainingMinutes: number, warning?: string }

2. [x] **Implement warning generation**
   - Return warning message when exceeded
   - Non-blocking - allow submission anyway

3. [ ] **Integrate with leave creation**
   - Call after duration calculation
   - Return warning in response for UI display

**Effort:** S

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Milestone 1 is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-03 | 1.0 | Milestone breakdown |

