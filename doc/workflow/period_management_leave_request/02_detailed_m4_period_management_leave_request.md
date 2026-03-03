# Detailed Phase - Milestone 4: Calendar Visualization

**Parent:** 02_task_plan_period_management_leave_request.md
**Files Involved:** 
- `components/calendar/team-calendar.tsx`
- `components/requests/leave-request-cell.tsx`
- `components/ui/tooltip.tsx`
- `lib/services/leave-request.service.ts`

## Task 4.1: Proportional Positioning (Mini-Gantt)

1. [ ] **Calculate vertical position**
   - Read start/end times from leave request
   - Map time to cell height percentage
   - Position bar accordingly within day cell

2. [ ] **Handle different durations**
   - Full day: spans entire cell height
   - Morning: top half (0-50%)
   - Afternoon: bottom half (50-100%)
   - Custom: exact proportional position

3. [ ] **Use company schedule**
   - Read minutesPerDay from company settings
   - Default to 09:00-18:00 if not set

**Effort:** M

## Task 4.2: Density Indicators

1. [ ] **Handle multiple requests per day**
   - Stack bars vertically when multiple requests exist
   - Use CSS flex/grid for stacking
   - Each request gets own row within cell

2. [ ] **Show exact time ranges**
   - Visual gap between stacked items
   - Different colors for different leave types
   - Compact mode for many requests

3. [ ] **Responsive sizing**
   - Adjust bar height based on cell size
   - Minimum height for visibility

**Effort:** M

## Task 4.3: Tooltips with Exact Intervals

1. [ ] **Create tooltip component**
   - Use existing `components/ui/tooltip.tsx`
   - Trigger on hover over leave bar

2. [ ] **Show detailed information**
   - Employee name
   - Exact time interval (e.g., "10:00 - 11:30")
   - Leave type with color
   - Any comments

3. [ ] **Format display**
   - "Employee Name | Leave Type | Time | Duration"
   - Include comment preview if present

**Effort:** S

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Milestone 4 is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-03 | 1.0 | Milestone breakdown |

