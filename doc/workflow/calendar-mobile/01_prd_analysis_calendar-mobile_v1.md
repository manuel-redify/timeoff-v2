# PRD Analysis - Calendar Mobile
**Version:** v1
**Date:** 2026-02-10
**Source PRD:** `doc/prd/prd_calendar_mobile.md`

## 🎯 Objective
Create a mobile-optimized version of the Calendar page that maintains the same data density and utility as the desktop version, optimized for touch interaction and one-handed operation, without disrupting the desktop layout.

## 📋 Feature & Logic Map
| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | User | Mobile UI Tokens | - Min row height: 60px (`3.75rem`).<br>- Typography scale: `0.85` where needed.<br>- Tap/Active states instead of Hover. | Prevent text overflow in narrow columns via scaling. |
| F02 | User | Responsive Toolbar | - Row 1: Team View title + Filters button (Right).<br>- Row 2: Nav Group (`<`, Mon/Year, `>`) + Today button. | Adapt vertical spacing for small viewports. |
| F03 | User | Filter Bottom Sheet | - Replace Right Sidebar with Bottom Sheet (90% height).<br>- Full-width Selects (Dept, Project, Role, Area).<br>- Neon Lime (`#e2f337`) sticky "Apply Filters" button. | Ensure sheet covers enough space but allows visual cues of the background if needed (though PRD says 90%). |
| F04 | User | Legend Access | - Collapse Legend into "Info" icon or place at top of Filter Bottom Sheet. | Avoid cluttering the main view. |
| F05 | User | Sticky Timeline Grid | - Sticky Left: Employee Column.<br>- Sticky Top: Days/Dates Header.<br>- Visual gradient/border on sticky edge.<br>- Locked intersection cell ("Employee"). | Maintain alignment during 2D scrolling. |
| F06 | User | Scroll Interaction | - `scroll-snap-type: x proximity` on grid.<br>- Fluid vertical scrolling without horizontal jitter. | Snap to day boundaries for better navigation. |
| F07 | User | Absence Popovers | - Trigger: Tap on absence pill.<br>- UI: Centered above pill or focused modal. | Ensure popover is not cut off by screen edges. |
| F08 | User | Faceted Search | - Real-time filtering: Dept selection filters Project options in Bottom Sheet. | Handle empty filtered states gracefully. |
| F09 | System | Loading & Empty States | - Skeleton screens with 60px row height.<br>- Empty state: Icon + "Reset Filters" thumb-friendly button. | Maintain grid layout during loading. |

## 🏗️ Data Entities (Domain Model)
- **Employee:** Listed in sticky left column, filtered by Dept/Project.
- **Absence/Leave:** Displayed as pills in the timeline, tap to show details.
- **Department/Project/Role/Area:** Filtering dimensions for the view.

## 🔗 Dependencies & Blockers
- **Internal:** Faceted search logic depends on Department/Project relationship. Mobile layout must co-exist with Desktop (requires careful CSS isolation/media queries).
- **External:** None specified.

## 🔧 Technical Stack & Constraints
- **Stack:** CSS-only sticky positioning (performance), Tailwind/Vanilla CSS for tokens.
- **Non-Functional:** Performance (no-stutter scroll), Accessibility (touch targets min 60px).
- **Constraints:** Viewport meta `user-scalable=no` required. Z-index hierarchy: Bottom Sheet (100) > Header (50) > Column (45).

## 🚫 Scope Boundaries
- **In-Scope:** Mobile-specific layout, bottom sheet filters, scroll snapping, touch-optimized grid.
- **Out-of-Scope:** Changing desktop layout, modifying backend API (assuming existing faceted logic works).

## ❓ Clarifications Needed
1. **Viewport Meta:** Setting `user-scalable=no` globally might affect other pages. Should this be scoped to the Calendar route?
2. **Animation:** PRD mentions Bottom Sheet "slides up", should we use a specific library (e.g., Framer Motion) or CSS transitions?
3. **Legend Icon:** Where exactly should the "Info" icon be placed for best UX?
