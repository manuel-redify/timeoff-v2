# PRD | Advanced Period Management for Leave Requests (Hours/Minutes)

**Status:** Draft (Updated with Admin Flow & Test Cases)
**Version:** 3.5
**Last Updated:** February 5, 2026

## 1. Summary & Goals

Evolution of the PTO system to support **exact time-based requests (hours/minutes)**. The system moves away from abstract "blocks" to save specific timestamps directly into the database, ensuring absolute precision and historical data consistency.

### Strategic Objectives

- **Precision**: Enable granular entries (e.g., 09:30–13:45).
- **Data Saturation**: All requests (including presets) are stored as real timestamps to avoid future ambiguity.
- **Admin Flexibility**: Complete leave management on behalf of employees with privilege overrides.

## 2. Functional Requirements

### 2.1 User Management & Roles

- **Self-service**: Standard users submit requests for themselves.
- **On-behalf (Admin)**: Dedicated flow for administrators to submit leave for employees:
    - **Employee Selection**: Upon opening the form, Admins see a `Combobox` (Shadcn) to search and select the target employee.
    - **Context Update**: Once selected, the form asynchronously loads user-specific data:
        - Updated balance (`allowance`).
        - Permitted leave types for that user's contract.
        - Project/Area association for correct tracking.
    - **Block Overrides**: Admins have the privilege to ignore "Insufficient Balance" warnings and proceed with creation.
    - **Request Status**: Requests created by Admins are set to `APPROVED` by default (bypassing approval workflows), unless the Admin explicitly selects a different status.
    - **Audit & Traceability**: Every operation must populate the `Audit` model, indicating who created the request (`byUserId`) and for whom it was created (`userId`).

### 2.2 Period Selection & Presets

The system manages duration via two input modes that populate the same database fields:

1. **Rapid Presets**:
    - **All Day**: Valid for both **single-day** and **multi-day** requests. Applies the standard company schedule (e.g., 09:00 - 18:00).
    - **Morning / Afternoon**: Available **only for single-day requests**. Populates predefined intervals (e.g., 09:00-13:00 or 14:00-18:00).
2. **Custom Range**:
    - Available **only for single-day requests** (`Start Date == End Date`).
    - Allows free selection of `Start Time` and `End Time` via a custom Time Picker.

### 2.3 Notes & Comments

- **Notes Field**: Optional `Textarea` (Shadcn) mapped to `employeeComment` for users or admins to provide justifications.

## 3. Technical Requirements & Data Model

### 3.1 Storage & Migration

- **Timestamp Saturation**: Every request saves `dateStart` and `dateEnd` as full `DateTime` objects. Even presets save real hours.
- **Source of Truth (Minutes)**: The technical field `durationMinutes` (Int) is the sole value used for business calculations and allowance deductions.
- **Visual Conversion (Company Standard)**:
    - To ensure global visual consistency, the conversion from minutes to "Days" in the UI uses a standard value defined at the **Company** level (e.g., 1 day = 480 minutes / 8 hours).
    - This conversion is purely aesthetic and does not affect the actual minutes stored.

## 4. Interface Design (Shadcn/UI)

- **Desktop**: Central `Dialog` (Modal). Vertical form development. `Tabs` or `ToggleGroup` for presets.
- **Mobile**: Bottom `Drawer`. Stacked layout with full-width inputs to maximize touch targets.
- **Time Picker (Custom)**:
    - To avoid cross-browser inconsistencies of `type="time"`, use a `Popover` containing two `ScrollArea` columns for **Hours** and **Minutes** (15-min steps recommended).

## 5. Validation & Feedback Logic

### 5.1 Multi-day Validation

- If `Start Date != End Date`, partial options (Morning/Afternoon) and Custom time are **disabled**.
- **Smart Reset**: If a user extends the date range after selecting a partial option, the form automatically resets to "All Day" and shows an `Alert` or `Toast` notification.

### 5.2 Error Handling

- **Chronological Check**: `End Time > Start Time` is mandatory.
- **Dynamic Label**: Displays calculated duration in real-time: *"Duration: **4h 30m** (approx. ~0.56 company days)"*.

## 6. Calendar Visualization (Team View)

1. **Proportional Positioning (Mini-Gantt)**:
    - Each absence is positioned vertically within the cell proportionally to its start/end time relative to the standard workday.
2. **Uniform Style**: No graphic distinction between preset-based and custom-based absences.
3. **Density Indicators**: Multiple requests on the same day are stacked vertically, showing exactly when the user is unavailable.
4. **Tooltips**: Always show the exact interval (e.g., "10:00 - 11:30") and any comments.

## 7. Edge Cases & Advanced Validations

### 7.1 Overlap Prevention

- **Rule**: The system must block the saving of requests that temporally overlap (even partially) with existing requests for the same user (excluding 'CANCELED' or 'REJECTED' states).

### 7.2 Allowance Validation (Informational)

- **Behavior**: Non-blocking. If `durationMinutes` exceeds `User.allowance`, show a `Warning Alert`: *"Warning: This request exceeds your remaining balance."* Users can still submit.

### 7.3 Working Days Calculation

- For multi-day requests, the backend must iterate through dates and sum working minutes based on `Schedule` and `BankHoliday`, excluding weekends and holidays.

## 8. Test Cases

### 8.1 UI & Form Validation

| ID | Scenario | Input | Expected Result |
| --- | --- | --- | --- |
| **TC-UI-01** | Single to Multi-day switch | Select Feb 5, choose "Morning", extend to Feb 6. | Form forces "All Day" and shows warning alert. |
| **TC-UI-02** | Chronological Error | Start Time 17:00, End Time 09:00. | Submit disabled, input marked as error (`destructive`). |
| **TC-UI-03** | Mobile Time Picker | Opening selector on smartphone. | `Drawer` opens with smooth scrolling for hours/minutes. |

### 8.2 Calculation Logic (Minutes)

| ID | Scenario | Context | Expected Result |
| --- | --- | --- | --- |
| **TC-CAL-01** | "Morning" Preset | Company Preset: 09:00-13:00. | `durationMinutes` saved as 240. |
| **TC-CAL-02** | Multi-day w/ Weekend | Fri (Full) to Mon (Full). | `durationMinutes` = 960 (480*2, Sat/Sun excluded). |
| **TC-CAL-03** | Visual Conversion | 2h request, 8h standard. | UI shows "2h 0m (~0.25 days)". |

### 8.3 Data Integrity & Business Rules
| ID | Scenario | DB State | Expected Result |
| --- | --- | --- | --- |
| **TC-INT-01** | Partial Overlap | Existing 09:00-11:00. Try 10:30-12:00. | Blocking Error: "Overlap with existing request". |
| **TC-INT-02** | Negative Balance | Balance 1h, Request 2h. | Warning Alert appears, submission allowed. |
| **TC-INT-03** | Admin Submission | Admin creates for User B. | `userId` = User B, `byUserId` = Admin ID. |