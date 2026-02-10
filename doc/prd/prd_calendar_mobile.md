# Product Requirements Document: Calendar page - Mobile Version

## 1. Overview & Mobile Mission

The mobile version of the Calendar page must provide the same data density and utility as the desktop version but optimized for one-handed operation and touch interactions. It must co-exist with the desktop implementation without affecting its layout.

## 2. Mobile Design Tokens (Adjustments)

- **Touch Targets:** Minimum row height is **`3.75rem` (60px)** (vs 3rem on desktop).
- **Scaling:** Use a scaling factor of `0.85` for typography where necessary to prevent text wrapping in narrow columns.
- **Interaction:** Replace all "Hover" states with "Active/Tap" states.

## 3. Layout & Component Adaptation

### A. Header & Toolbar (Responsive Stack)

- **Structure:** On mobile, the Control Bar must adapt to vertical space constraints.
    - **Row 1:** "Team View" title and the "Filters" button (aligned to the right).
    - **Row 2:** Time Navigation Group (`<`, Month/Year, `>`) and "Today" button.
- **Geometry:** Maintain the `rounded-lg` (0.75rem) for the control bar container and `rounded-sm` for buttons.

### B. Filter System (Bottom Sheet)

- **Transition:** Replace the Right Sidebar Drawer with a **Bottom Sheet**.
- **Behavior:** The sheet slides up from the bottom, covering 90% of the screen.
- **Components:** Use full-width `Select` components for Department, Project, Role, and Area.
- **Footer:** A sticky "Apply Filters" button at the bottom of the sheet in Neon Lime (`#e2f337`).

### C. The Legend (Contextual Access)

- **Mobile Placement:** To save vertical space, the legend can be collapsed into an "Info" icon near the title or placed at the very top of the Bottom Sheet filter panel.

## 4. The Timeline Grid (Mobile UX)

### A. Horizontal Navigation & Snap

- **Sticky Column:** The "Employee Name" column must remain `sticky left`.
- **Visual Indicator:** Add a subtle `linear-gradient` (white to transparent) or a slightly darker border on the right edge of the sticky column to indicate that data is scrolling underneath it.
- **Scroll Snap:** Implement `scroll-snap-type: x proximity` on the grid container. This ensures that when a user swipes, the grid "snaps" to the start of a day column rather than stopping halfway.

### B. Two-Dimensional Scrolling

- The header (Days/Dates) must remain `sticky top`.
- The intersection cell ("Employee") remains locked in both directions.
- Ensure that vertical scrolling is fluid and does not trigger unintended horizontal shifts.

### C. Absence Pills & Popovers

- **Trigger:** Popovers must be triggered by a **Tap** (click) on the absence pill.
- **UI:** The popover should appear centered above the tapped pill or as a small focused modal to ensure it doesn't get cut off by the screen edges.

## 5. Mobile-Specific Logic

### A. Faceted Search

- The faceted logic defined in the Filter PRD remains identical: selecting a Department must filter the available Projects in the Bottom Sheet in real-time.

### B. Empty & Loading States

- **Skeleton Screens:** Use the same `animate-pulse` strategy. Ensure the skeleton grid reflects the mobile row height (`3.75rem`).
- **Empty State:** Display a centered minimalist icon with a "Reset Filters" button that is easy to tap with the thumb.

## 6. Technical Requirements

- **Z-Index Management:** Bottom Sheet (100) > Sticky Header (50) > Sticky Column (45) > Grid Content.
- **Performance:** Use CSS-only sticky positioning to avoid "stuttering" during scroll on mobile browsers.
- **Viewport:** Ensure `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">` is set to prevent accidental zooming while interacting with the grid.