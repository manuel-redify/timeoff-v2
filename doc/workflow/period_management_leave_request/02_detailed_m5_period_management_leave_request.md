# Detailed Phase - Milestone 5: Validation & Integration

**Parent:** 02_task_plan_period_management_leave_request.md
**Files Involved:** 
- `components/requests/leave-request-form.tsx`
- `lib/services/leave-request.service.ts`
- `lib/leave-calculation-service.ts`
- `tests/`

## Task 5.1: Multi-day Smart Reset Logic

1. [x] **Detect date range change**
    - Watch for changes in start/end date
    - Compare to determine single-day vs multi-day

2. [x] **Reset partial options**
    - When multi-day detected, auto-set to All Day
    - Disable Morning/Afternoon/Custom options
    - Show Toast notification: "Partial day options reset for multi-day requests"

3. [x] **Handle custom time reset**
    - Clear custom start/end time when extending to multi-day
    - Reset to default All Day preset

**Effort:** M

## Task 5.2: Chronological Validation

1. [x] **Add time order check**
    - Validate endTime > startTime when custom range selected
    - Block submission if invalid

2. [x] **Show error state**
    - Mark time inputs as error (destructive)
    - Display error message below inputs

3. [x] **Real-time feedback**
    - Validate on blur and on submit
    - Clear error when corrected

**Effort:** S

## Task 5.3: Real-time Duration Display

1. [x] **Calculate on form change**
    - Trigger recalculation when date/time changes
    - Use calculateDurationMinutes for accurate minutes

2. [x] **Format display**
    - Show "Duration: Xh Ym (~Z days)"
    - Use minutesPerDay for day conversion
    - Update in real-time as user selects options

3. [x] **Position in form**
    - Show below date/time inputs
    - Clear and prominent display
    - Update with loading state if needed

**Effort:** M

## Task 5.4: End-to-End Testing

1. [x] **UI & Form Validation Tests**
    - TC-UI-01: Single to Multi-day switch
    - TC-UI-02: Chronological Error validation
    - TC-UI-03: Mobile Time Picker

2. [x] **Calculation Logic Tests**
    - TC-CAL-01: Morning Preset (240 min)
    - TC-CAL-02: Multi-day with Weekend (960 min)
    - TC-CAL-03: Visual Conversion display

3. [x] **Data Integrity Tests**
    - TC-INT-01: Partial Overlap blocking
    - TC-INT-02: Negative Balance warning
    - TC-INT-03: Admin Submission audit trail

4. [x] **Integration tests**
    - Create API endpoint tests
    - Test full form submission flow
    - Verify database state after creation

**Effort:** L

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Milestone 5 is finished.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-03-03 | 1.0 | Milestone breakdown |
