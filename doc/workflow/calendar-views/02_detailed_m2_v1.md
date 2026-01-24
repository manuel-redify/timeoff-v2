# Detailed Phase - Milestone 2: UI & Frontend [COMPLETE]
**Version:** v1
**Date:** 2026-01-23
**Feature:** Calendar Views

## 🎯 Objectives
Build the visual components for accessing and viewing calendar data as defined in the PRD.

## 🧱 Components to Build
1.  **CalendarHeader**: Common controls for view switching, month/year navigation, and filtering.
2.  **MonthView**: Standard 7-column grid layout for a single month.
3.  **WallChartView**: Horizontal timeline for team-wide visibility.
4.  **ListView**: Filterable table of leave requests.
5.  **CalendarAbsenceCard**: Visual indicator for an absence (color-coded, status-aware).

## 🛠 Technical Approach
- Use `date-fns` for all date logic.
- Use `shadcn/ui` components (Button, Select, Card, Tooltip, Skeleton).
- Implement client-side filtering and state management for view/date selection.
- Ensure responsive design for mobile (List view focus on mobile).

## 📅 Roadmap
- **Task 2.1**: Month and Year grid implementations.
- **Task 2.2**: Wall Chart (Team View) timeline.
- **Task 2.3**: List View with advanced filtering UI.
- **Task 2.4**: Visual styling (Absence Cards, Legends, Tooltips).
