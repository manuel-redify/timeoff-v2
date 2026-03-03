# Detailed Phase - Milestone 2: Frontend Form Components

**Parent:** 02_task_plan_period_management_leave_request.md
**Files Involved:** 
- `components/requests/leave-request-form.tsx`
- `components/ui/dialog.tsx`
- `components/ui/drawer.tsx`
- `components/ui/popover.tsx`
- `components/ui/scroll-area.tsx`

## Task 2.1: Build Custom Time Picker Component

1. [ ] **Create TimePicker component**
   - Create `components/ui/time-picker.tsx`
   - Use Popover containing two ScrollArea columns for Hours and Minutes
   - Support 15-minute steps
   - Accept onChange callback with { hours: number, minutes: number }

2. [ ] **Add time formatting utilities**
   - Format display as "HH:mm" (e.g., "09:30")
   - Handle 12h/24h preference from user settings

3. [ ] **Integrate with existing form**
   - Add startTime and endTime fields to form schema
   - Show time picker when "Custom Range" is selected

**Effort:** M

## Task 2.2: Implement Period Selection Presets

1. [ ] **Update RadioGroup/ToggleGroup for presets**
   - Keep existing: All Day, Morning, Afternoon
   - Add new option: Custom Range (enables time picker)
   - Use ToggleGroup from shadcn/ui for better UX

2. [ ] **Add visual feedback**
   - Show time ranges next to preset labels (e.g., "All Day (09:00-18:00)")
   - Highlight selected preset clearly

3. [ ] **Disable partial options for multi-day**
   - When Start Date != End Date, disable Morning/Afternoon
   - Auto-reset to "All Day" if user extends date range

**Effort:** S

## Task 2.3: Add Custom Range Time Selection

1. [ ] **Create custom time mode**
   - Enable time picker only for single-day requests
   - Show both start time and end time pickers
   - Add chronological validation (end > start)

2. [ ] **Add real-time duration display**
   - Show "Duration: Xh Ym (~Z days)" below the time pickers
   - Calculate using minutesPerDay from company settings

3. [ ] **Handle edge cases**
   - Prevent end time before start time
   - Show error state if invalid

**Effort:** M

## Task 2.4: Build Mobile-Optimized Drawer Layout

1. [ ] **Create mobile version using Drawer**
   - Use existing `components/ui/drawer.tsx`
   - Stack form fields vertically
   - Full-width inputs for touch targets

2. [ ] **Responsive behavior**
   - Desktop: Dialog (Modal)
   - Mobile: Bottom Drawer
   - Use `useMediaQuery` or CSS to switch

3. [ ] **Mobile-specific time picker**
   - Larger touch targets
   - Smooth scrolling for hours/minutes
   - Optimized for thumb reach

**Effort:** M

## Task 2.5: Add Notes Textarea Component

1. [ ] **Enhance existing Textarea**
   - Use existing `components/ui/textarea.tsx`
   - Map to `employeeComment` field
   - Add character limit indicator (255 chars)

2. [ ] **Position in form**
   - Place after date/time selection
   - Optional field with clear label

**Effort:** S

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Milestone 2 is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-03 | 1.0 | Milestone breakdown |

