# Detailed Phase - Milestone 2: Navigation & Action Components
**Parent:** `02_task_plan_navigation-bar-restyling.md`
**Files Involved:** `components/ui/MainNavigation.tsx`, `assets/logo.svg`

### Task 2.1: Update Logo and basic nav links
1. [ ] Integrate `assets/logo.svg` as the primary brand element (left-aligned).
2. [ ] Style "Dashboard" and "Team View" links using Redify styling:
    - Idle: `neutral-400` text.
    - Hover: `neutral-100` BG, `neutral-900` text, `rounded-full`.
    - Active: `#f2f3f5` BG, Bold `neutral-900` text.

### Task 2.2: Implement responsive "New Leave" button
1. [ ] Create a conditional render for the "New Leave" action based on screen size (or use Tailwind responsive utilities):
    - **Desktop:** Pill-shaped, BG `#e2f337`, Black text, "New Leave" label.
    - **Mobile:** Circular BG `#e2f337`, Plus icon (`+`).
2. [ ] Apply `ease-in-out` transitions and `scale-98` on active click.

### Task 2.3: Redesign User Avatar with dropdown menu
1. [ ] Implement circular Avatar with initials (Skeleton for loading).
2. [ ] Add `0.0625rem` solid `primary` (#e2f337) border on hover.
3. [ ] Implement Dropdown menu containing:
    - User's Full Name (Display only).
    - "Profile" link.
    - "Logout" action.
4. [ ] Ensure `Esc` key closes the dropdown.

## 🔄 Next Steps
- Create Task Checklist for Task 2.1 (`02_checklist_navigation-bar-restyling_t2.1.md`).
- Overwrite this file to mark tasks as `[x]` upon completion.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Milestone 2 breakdown |
