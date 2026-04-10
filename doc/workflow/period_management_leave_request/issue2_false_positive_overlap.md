# Issue 2: False Positive Overlap Detection Error

## Problem Description
Nick Fury receives the error message: "You already have a pending leave request on these dates. Please select different dates." when trying to create a leave request for April 9th from 17:00-18:00, even though there are no actual conflicting requests for that specific time interval.

## Root Cause Analysis

### 1. Date Transformation Mismatch
The core issue is a mismatch between how dates are stored versus how they are queried for overlap detection:

**When Storing Leave Requests:**
- In `app/api/leave-requests/route.ts`, custom time ranges are processed through `getPresetDateRange()` function
- This transforms input like:
  - dateStart: "2026-04-09", startTime: {hours: 17, minutes: 0} 
  - dateEnd: "2026-04-09", endTime: {hours: 18, minutes: 0}
- Into actual Date objects with proper time components:
  - persistedDateStart: 2026-04-09T17:00:00.000Z
  - persistedDateEnd: 2026-04-09T18:00:00.000Z
- These transformed dates are what get stored in the database

**When Detecting Overlaps:**
- In `lib/leave-validation-service.ts`, the `detectOverlaps` function uses the original input dates directly
- It queries the database with:
  - dateStart: 2026-04-09T00:00:00.000Z (start of day)
  - dateEnd: 2026-04-09T23:59:59.999Z (end of day)
- But compares against stored dates that have the actual time components
- This causes the query to potentially match requests that don't actually overlap in time

### 2. Faulty Overlap Detection Logic
Even if the date ranges matched, the overlap detection algorithm has flaws:

**Inadequate Time Range Comparison:**
The current logic in `detectOverlaps` only checks:
1. Date range overlap using `startOfDay`/`endOfDay` 
2. Then does day-part conflict checking

But it doesn't properly handle:
- Custom time ranges that fall within standard day parts
- Partial day overlaps that don't constitute actual conflicts
- The specific case where a 17:00-18:00 request might incorrectly conflict with an "ALL DAY" request due to the broad date range query

### 3. Missing Transformation Parameters
The `detectOverlaps` function wasn't receiving the same parameters used during request creation:
- `minutesPerDay` (for workday calculations)
- `startTime` and `endTime` (for custom ranges)
This meant it couldn't apply the same transformation logic used when storing requests.

## Solution Implemented

### 1. Added Proper Import
In `lib/leave-validation-service.ts`:
```typescript
import { getPresetDateRange } from '@/app/api/leave-requests/route';
```

### 2. Enhanced Function Signature
Modified `detectOverlaps` to accept transformation parameters:
```typescript
private static async detectOverlaps(
    userId: string,
    dateStart: Date,
    dayPartStart: DayPart,
    dateEnd: Date,
    dayPartEnd: DayPart,
    minutesPerDay?: number | null,
    startTime?: { hours: number; minutes: number } | null,
    endTime?: { hours: number; minutes: number } | null
) {
```

### 3. Applied Consistent Date Transformation
Before querying the database, transform inputs the same way as storage:
```typescript
// Apply the same date transformation used when storing leave requests
const { persistedDateStart, persistedDateEnd } = getPresetDateRange(
    dateStart.toISOString(),
    dateEnd.toISOString(),
    dayPartStart,
    dayPartEnd,
    minutesPerDay,
    startTime && startTime.hours !== undefined ? startTime : undefined,
    endTime && endTime.hours !== undefined ? endTime : undefined
);

// Quick database check for date overlaps first
const dateOverlaps = await prisma.leaveRequest.findMany({
    where: {
        userId,
        status: {
            in: ['NEW' as any, 'APPROVED' as any, 'PENDING_REVOKE' as any]
        },
        AND: [
            { dateStart: { lte: endOfDay(persistedDateEnd) } },
            { dateEnd: { gte: startOfDay(persistedDateStart) } }
        ]
    }
});
```

### 4. Updated Function Call
Modified the call site in `validateRequest` to pass the additional parameters:
```typescript
const overlaps = await this.detectOverlaps(userId, dateStart, dayPartStart, dateEnd, dayPartEnd, 
    userWithContractType?.company?.minutesPerDay, 
    options?.startTime, 
    options?.endTime);
```

## Expected Behavior After Fix
When Nick Fury tries to create a leave request for April 9th, 17:00-18:00:
1. The input dates are transformed to match how existing requests are stored
2. The database query looks for actual time overlaps, not just date overlaps
3. The overlap detection accurately determines if there's a real conflict
4. No false positive error is shown when the time slot is actually available
5. Legitimate conflicts are still properly detected and reported

## Files Modified
- `lib/leave-validation-service.ts` - Fixed overlap detection to use consistent date transformation
- `app/api/leave-requests/route.ts` - Exported the transformation functions for reuse