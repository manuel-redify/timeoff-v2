# PRD Analysis - Calendar Page Restyle
**Version:** v1
**Date:** 2026-02-09
**Source PRD:** `doc/prd/prd_calendar_page_restyle.md`

## 🎯 Objective
Transform the "Team View" (Calendar) into a high-efficiency interface following the Redify design system. Focus on visibility, desktop-optimized grid, and mobile usability with a Neon Lime accented theme.

## 📋 Feature & Logic Map
| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | User/Admin | Global Header | "Team View" title with Legend (color dots) and Search Bar (username) directly below. | Search should filter local data or trigger API refresh. |
| F02 | User/Admin | Time Navigation | Right-aligned chevron group with time label (e.g., "December, 2025"). | Handle month overflow (Dec -> Jan next year). |
| F03 | User/Admin | Action Toolbar | "Today" button (reset) and "Filters" button with badge. | Badge count must sync with active filters. |
| F04 | User/Admin | Filter Drawer | Right Sidebar (Desktop) / Bottom Sheet (Mobile) with 4 selectors: Dept, Project, Role, Area. | Handle multi-select logic. Current code has simple Select. |
| F05 | User/Admin | Active Filter Tags | Neon Lime `#e2f337` tags below header with "Clear all" link. | Tags must be removable individually. |
| F06 | User/Admin | Responsive Grid | Bidirectional stickiness (Name column Left, Day Header Top). Saturday/Sunday highlight (`#f7f9fa`). | Sticky intersection must have high z-index. |
| F07 | User/Admin | Today Highlight | Background `#f2f7ff` for current day column (overrides weekend shading). | Must update dynamically if day changes without refresh. |
| F08 | User/Admin | Absence Pills | Colored blocks with Lucide icons. Hover triggers Popover with leave details. | Handle overlapping absences in the same cell. |
| F09 | System | Skeleton Screens | Pulse animation (`neutral-100`) for headers, name blocks, and timeline grid. | Borders must remain visible during skeleton state. |
| F10 | System | Virtualization | Mandatory for >50 members to ensure 60fps scrolling. | Synchronizing sticky headers with virtualized content. |

## 🏗️ Data Entities (Domain Model)
- **User:** Name, Department, Project, Role, Area (Current model might lack Project/Role/Area at the user level or require new relations).
- **LeaveRequest:** Start/End dates, LeaveType, Status, Notes.
- **LeaveType:** Name, Color, Icon.
- **BankHoliday:** Date, Country, Company reference.

## 🔗 Dependencies & Blockers
- **Internal:** F04 (Drawer) is needed to trigger F05 (Tags).
- **Internal:** Grid Virtualization (F10) is a prerequisite for F06 (Sticky behavior) to ensure performance.
- **External:** Lucide React icons for all status mapping.

## 🔧 Technical Stack & Constraints
- **Stack:** Next.js (App Router), Tailwind CSS, Lucide React, Framer Motion (for drawer/bottom sheet).
- **Modern CSS:** `position: sticky` for grid. `scroll-snap-type: x proximity` on mobile.
- **Grid Borders:** Fixed `0.0625rem` (1px) `neutral-200`.
- **Z-Index:** Header (10) > Column (9) > Pills (5) > Tooltips (20).

## 🚫 Scope Boundaries
- **In-Scope:** Team View restyling, Filters Drawer, Skeleton screens, Responsive behavior.
- **Out-of-Scope:** Month View (box style) box restyling (PRD focuses on Timeline/Team View), List View restyling.

## ❓ Clarifications Needed
1. **Filter Fields:** PRD mentions `Project`, `Role`, `Area`. Current `User` model and `api/users` might not support these yet.
2. **Virtualization Library:** Should I use `react-window` or `tanstack-virtual`? (Redify standard preferred).
3. **Search Behavior:** Does the "Search Bar" filter the current view only or fetch from server? client-side filter

### 4. Output Persistence & Workflow
**Path:** `doc/workflow/calendar-page-restyle/01_prd_analysis_v1.md`

**Pre-save Checklist:**
- [x] Source PRD reference included?
- [x] Feature table complete with Roles and Logic?
- [x] Main data entities identified?
- [x] Internal/External dependencies mapped?
- [x] Edge cases extracted?
