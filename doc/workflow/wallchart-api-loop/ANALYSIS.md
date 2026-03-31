# Wall Chart API Continuous Call Issue Analysis

## Problem Description
The API endpoint `/api/calendar/wall-chart?start_date=2026-03-01&end_date=2026-03-31` was being called continuously when navigating to the `/calendar` page, even without user interaction.

## Root Cause Analysis

### Conflicting Mobile State Management
The issue was caused by two separate components managing `isMobile` state independently:

1. **`useCalendarParams.ts`** (lib/hooks/use-calendar-params.ts)
   - Local `isMobile` state with `useState(false)`
   - Sets initial value once on mount using `window.matchMedia('(max-width: 1023px)').matches`
   - **Intentionally does NOT listen to resize events** (see comments lines 19-22)

2. **`CalendarHeader.tsx`** (components/calendar/calendar-header.tsx)
   - Separate local `isMobile` state with `useState(false)`  
   - Sets initial value AND **adds resize event listener** (lines 120-125)
   - Updates state on every window resize event

### How This Caused Continuous API Calls
1. Window resize events (even minor fluctuations) triggered `CalendarHeader`'s resize listener
2. This caused `CalendarHeader` to re-render with updated `isMobile` state
3. The re-render propagated through the component tree, causing `WallChartView` to receive new props or remount
4. `WallChartView`'s `useEffect` (lines 341-348) re-ran whenever its `requestUrl` dependency changed
5. Each effect run triggered a new API call to fetch wall chart data
6. During normal browser usage, resize events fire frequently, creating the appearance of continuous API calls

### Supporting Evidence
- Dev server logs showed repeated `/api/calendar/wall-chart` requests with 200-300ms response times
- Comments in `useCalendarParams.ts` explicitly warned about layout thrashing from dynamic view changes on resize
- The `CalendarHeader` component was the only place adding resize listeners for mobile detection

## Solution Implemented

Replaced both conflicting `isMobile` implementations with the existing, safe `hooks/use-mobile.ts` hook:

### Changes Made

1. **Updated `useCalendarParams.ts`**:
   - Imported `useIsMobile` from `~/hooks/use-mobile`
   - Replaced local `isMobile` state with `const isMobile = useIsMobile()`
   - Removed the initial `useEffect` that set mobile state

2. **Updated `CalendarHeader.tsx`**:
   - Imported `useIsMobile` from `~/hooks/use-mobile`
   - Replaced local `isMobile` state with `const isMobile = useIsMobile()`
   - Removed the `useEffect` that added/removed resize event listeners

### Why This Fixes the Issue
- Uses a single, centralized mobile detection mechanism (`hooks/use-mobile.ts`)
- Eliminates the resize listener conflict between components
- Maintains proper mobile/desktop view switching functionality
- Prevents the component remounting cycle that caused continuous API calls
- Leverages existing, tested code already present in the codebase

## Verification
After implementing the fix:
- Navigated to `/calendar` page
- Monitored dev server logs confirmed `/api/calendar/wall-chart` requests now occur only:
  - On initial page load
  - When user actually changes views or filters
- No continuous/request-spamming behavior observed during idle state
- Mobile/desktop view switching continues to work correctly

## Files Modified
- `lib/hooks/use-calendar-params.ts`
- `components/calendar/calendar-header.tsx`

## References
- [hooks/use-mobile.ts](@/hooks/use-mobile.ts) - The centralized mobile detection hook used in the solution
- [CalendarHeader comments](@/lib/hooks/use-calendar-params.ts:19-22) - Original explanation about avoiding resize listeners