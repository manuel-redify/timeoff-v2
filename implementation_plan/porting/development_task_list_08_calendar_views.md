# Phase 8: Calendar Views & Visualization - Task List

## Overview
This phase implements the primary visual interfaces of the application. It provides employees and managers with clear visibility into absences via multiple view types (Month, Year, Wall Chart, and List). It also includes external calendar integration via iCal feeds, allowing users to sync their leave with their personal calendars (Google, Outlook, etc.).

## Prerequisites
- [ ] Phase 1 (Foundation & Setup) completed.
- [ ] Phase 2 (User Management & Authentication) completed.
- [ ] Phase 3 (Company & Organizational Structure) completed.
- [ ] Phase 4 (Leave Type Configuration) completed.
- [ ] Phase 5 (Employee Allowance Management) completed.
- [ ] Phase 6 (Leave Request Workflow) completed.
- [ ] Phase 7 (Approval & Supervisor Dashboard) completed.
- [ ] Read and understood [PRD 05: Calendar Views & Visualization](file:///prd/porting_prd/prd_05_calendar_views_and_visualization.md).

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **Implement iCal Feed Token**: Add `ical_feed_token` (UUID) to the `User` model in `schema.prisma`.
  - **Done looks like**: Prisma schema updated, migration applied, and token auto-generation logic implemented.
- [ ] **Calendar Data APIs**: Implement specialized endpoints for different views.
  - **Done looks like**: `GET /api/calendar/month`, `GET /api/calendar/wall-chart`, and `GET /api/calendar/list` implemented with support for filtering and permission checks.
- [ ] **iCal Feed Generator**: Implement `GET /api/calendar/ical/:token` to serve RFC 5545 compliant calendar data.
  - **Done looks like**: Endpoint returns valid `.ics` content with approved absences, handling half-days and timezones correctly.
- [ ] **Performance Optimization**: Ensure calendar queries are efficient and leverage indexes.
  - **Done looks like**: Large companies (>500 users) can load the calendar in < 2 seconds.

### 2. UI & Frontend
- [ ] **Core Calendar Component**: Build the Month and Year view grids.
  - **Done looks like**: Interactive month grid with navigation, highlighted "Today", and colored leave indicators.
- [ ] **Wall Chart View**: Build the horizontal timeline view for teams/departments.
  - **Done looks like**: Responsive horizontally-scrolling timeline showing continuous leave bars for users.
- [ ] **List View & Filtering**: Build the tabular view with advanced filtering controls.
  - **Done looks like**: Table with sorting, pagination, and multi-select filters for department, status, and leave type.
- [ ] **Legend & Accessibility**: Implement a visual legend and ensure color-blind accessibility.
  - **Done looks like**: Clear legend for colors/patterns; use of patterns (hatching) for status distinction.
- [ ] **External Feed Management UI**: Add iCal link generation and management to user settings.
  - **Done looks like**: Users can copy their feed URL and regenerate their token if needed.

### 3. Integration & Glue Code
- [ ] **URL State Persistence**: Integrate view and filter state with URL query parameters.
  - **Done looks like**: Users can bookmark specific calendar views and filters; "Back" button works as expected.
- [ ] **Real-time Updates**: Ensure the calendar reflects state changes from other phases (e.g., new requests or approvals).
  - **Done looks like**: Successive navigation or page refresh accurately shows the latest approved/pending data.
- [ ] **Responsive Adaptation**: Implement mobile-specific layouts for all views.
  - **Done looks like**: Month view switches to a simplified dot/count indicator on mobile; Wall chart supports sticky headers.

## Acceptance Criteria
- [ ] All leave requests (approved, pending, pended revoke) are accurately visualized across all views.
- [ ] Wall chart correctly renders multi-day absences as continuous bars.
- [ ] iCal feeds are valid and recognized by major external calendar providers.
- [ ] Performance meets the < 2s load time requirement for reasonably sized data sets.
- [ ] Filtering and navigation are smooth and persist correctly in the URL.

## Testing & Validation Checklist
- [ ] Unit tests for the iCal generation logic (check RFC compliance).
- [ ] Unit tests for the date-range query builders (ensure no edge-case leaks).
- [ ] Integration tests for calendar permissions (ensure users only see what they're allowed to).
- [ ] Manual verification of half-day rendering on both Month and Wall Chart views.
- [ ] Manual smoke test in Google Calendar/Outlook using a generated iCal link.
- [ ] Mobile responsiveness check for the Wall Chart (sticky headers and horizontal scroll).
