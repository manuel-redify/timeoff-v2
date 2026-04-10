# Bank Holidays by Country PRD (v2.1) - AI-Agent Ready

**Created by:** Manuel Magnani

**Creation Date:** December 19, 2025

**Last Updated:** February 4, 2026

**Status:** Ready for Dev

### 1. Definitions

- **Employee Country**: The country code (ISO 3166-1 alpha-2) associated with a specific employee profile.
- **Company Country**: The country configured in the Company's General Settings.
- **Active Country**: A country is considered "active" if it matches the **Company Country** OR if it is assigned to at least one **active user**.
- **Bank Holiday Status**:
    - `Validated`: Holiday confirmed by the admin.
    - `Pending`: Automatically imported holiday awaiting admin verification.
- **Manual Override**: Any manual modification (addition/deletion) performed by an admin that must persist over automated syncs.

### 2. Core Rules

1. **Country Scoping**: Bank Holidays MUST be stored, retrieved, and managed per country.
2. **Year/Country Mapping**: Each Bank Holiday MUST be uniquely associated with exactly one country and one specific calendar year.
3. **Full-Day Constraint**: The system MUST only handle full-day holidays. Half-day holidays are not supported.
4. **Data Precedence**: Manual overrides MUST always take precedence over automated imports. Automated syncs MUST NOT overwrite manual changes.

### 3. Automated Import Logic (System Triggers)

### 3.1 Initial Setup

The first-time import for the **Company Country** MUST be a manual action triggered by the Admin via the Bank Holiday settings page. This is to prevent incorrect data loading if the default company country is not yet finalized.

### 3.2 User Creation/Update Trigger (Single & Bulk)

Whenever a new user is created or an existing user's country is modified:

1. The system MUST check if the target country exists in the database for the current year.
2. If the data is missing:
    - The system MUST trigger an automated import for that country.
    - The system MUST notify the Admin via an **in-app toast notification** (e.g., "Imported 12 holidays for new country: Brazil").
3. **Bulk Import Logic (AI Implementation Note)**: For CSV/Batch user uploads, the system MUST group (batch) import requests by country to avoid redundant API calls and multiple notifications for the same country.

### 3.3 Year Transition Trigger (Settings)

Within the Bank Holiday Management page (Admin only):

- Navigating to the next year MUST trigger a massive automated import for all **Active Countries** not yet present in the database for that year.

### 4. Frontend Behavior: Team View

1. **Contextual Display**: Each row in the Team View MUST display holidays based on the specific Employee Country.
2. **Navigation Limit**: Users are restricted to navigating a maximum of **1 year into the future** from the current date.
3. **Missing Data State**: If holidays for the viewed year/country are missing, the UI MUST display a placeholder message: *"Bank Holidays for [Year] have not been confirmed for your country yet. Please contact your administrator."*

### 5. Validation & System Notifications

1. **Admin Email Reminder**: The system MUST send an automated email to all Admins **two months before the end of the year** (e.g., November 1st) as a reminder to validate holidays for the upcoming year across all Active Countries.
2. **Pending State Logic**: Automatically imported holidays MUST default to the `Pending` status until manually confirmed by an admin.
3. **Observed Days**: Compensation days (e.g., a Monday holiday when the actual date falls on a Sunday) MUST be handled manually by the Admin by adding a custom holiday.

### 6. Manual Override Protection (Logic for Agents)

To ensure automated imports do not revert admin decisions:

1. **Soft Delete**: When an admin deletes a standard holiday, the system MUST NOT remove the record physically. It MUST set a flag (e.g., `is_deleted: true`).
2. **Sync Guard**: Automated import scripts MUST ignore any dates already marked with `is_deleted` or modified manually.
3. **Yearly Isolation**: Manual overrides MUST NOT be carried over to the following year. Each year starts with a fresh automated import of standard dates.

### 7. Bank Holiday Management Page (Admin UI)

1. **Country Filtering**: Admins MUST be able to switch between all Active Countries using a dropdown filter.
2. **Default State**: The page MUST default to the Company Country upon loading.
3. **Bulk Validation**: A "Validate All" button MUST be available to confirm all `Pending` holidays for the selected country and year in a single action.

### 8. Normative Scenario

**Context:**

- Company Country: Italy.
- Active Countries: Italy, India (due to Active User "Manish").

**Workflow:**

1. **November 1st**: System sends reminder email to Admin.
2. **Admin Access**: Admin enters settings and selects "2027". System automatically fetches standard data for Italy and India.
3. **Validation**: Admin reviews Indian dates, adds one manual "Observed Day," and clicks "Validate All."
4. **Visibility**: Team View now displays the 2027 confirmed calendar for both Italian and Indian employees.