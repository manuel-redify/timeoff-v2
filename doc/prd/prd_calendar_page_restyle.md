# Product Requirements Document: Calendar page Restyling

## 1. Overview & Objective

The project involves a complete restyling of the "Team View" page content area. The goal is to transform the dashboard into a high-efficiency interface that adheres to the **Redify** design system, optimizing leave visibility on desktop screens (full-width) and ensuring excellent usability on mobile devices.

## 2. Design Standards (Design Tokens)

Implementation must strictly follow Redify's system constraints:

- **Borders:** Fixed thickness of `0.0625rem` (1px). Color: `neutral-200` (#e5e7eb).
- **Shadows:** None (shadow: none). Use only subtle gradients to indicate scrolling on mobile.
- **Radius:**
    - Interactive elements (Buttons, Filter Tags, Inputs, Absence Pills): `rounded-sm` (0.25rem).
    - Main containers (Cards): `rounded-lg` (0.75rem).
- **Typography:** "Inter" family. Primary text: `neutral-900`. Secondary text: `neutral-600`.
- **Highlighter Strategy:** Neon Lime (`#e2f337`) is reserved exclusively for primary actions and active states (e.g., active filter tags).

## 3. Functional Specifications: Desktop View

### A. Header, Toolbar, and Legend

- **Page Title:** "Team View" at the top left.
- **Legend (Below Title):**
    - **Position:** Directly beneath the "Team View" title, left-aligned.
    - **Style:** Horizontal list with color dots (`radius.full`) and `neutral-600` labels.
- **Search Bar:** Quick search input for usernames next to the title (minimalist style, `0.0625rem` border).
- **Time Navigation Group:**
    - **Position:** Right-aligned.
    - **Structure (Flexbox):** 1. `ChevronLeft` icon button (outline). 2. Time Label (e.g., "December, 2025") semibold. 3. `ChevronRight` icon button (outline).
- **Action Toolbar:**
    - "Today" Button: Resets the view to the current month.
    - "Filters" Button: Includes a badge with the active filter count. Opens the **Right Sidebar Drawer**.

### B. Filtering System & Drawer

- **Drawer:** Contains 4 multi-select fields (`Department`, `Project`, `Role`, `Area`).
- **Active Filter Visualization:** A row of Neon Lime `#e2f337` tags below the header. Each tag is `rounded-sm` with a removal icon. A "Clear all" link (underlined) appears at the end of the row.

### C. The Timeline (Full-Width Grid)

- **Sticky Behavior (Bidirectional):**
    - **Name Column:** Sticky Left. Displays username only (no avatars). Row hover highlighted with `neutral-50`.
    - **Day Header:** Sticky Top. Days and dates remain fixed during vertical scroll.
    - **Intersection (Top-Left):** The "Name" header cell is locked in both directions with a high `z-index`.
- **Cell Visualization:**
    - **Weekends:** Saturday/Sunday columns with background `#f7f9fa`.
    - **Today Highlight:** Current day column with background `#f2f7ff` (takes priority over weekend shading).
- **Absence Pills & Tooltips:**
    - Colored blocks with Lucide icons.
    - **Interaction:** On hover, a Popover displays: *Leave type, Exact dates, Status, and any Notes*.

## 4. Functional Specifications: Mobile View

- **Touch Targets:** Row height increased to `3.75rem` (Desktop standard: `3rem`).
- **Scroll UX:** `scroll-snap-type: x proximity`. A subtle gradient shadow on the sticky name column to indicate depth and horizontal scroll.
- **Bottom Sheet:** The Filter Drawer transforms into a bottom-up sliding panel on screens < 768px.
- **Legend Mobile:** May be moved inside the drawer or displayed via horizontal scroll under the title.

## 5. Loading Strategy: Skeleton Screens

To improve "Perception of Speed," a structured skeleton screen must be displayed during data fetching:

- **Header Skeleton:** Rectangular blocks for the title, legend, and navigation buttons.
- **Grid Skeleton:**
    - **Names (Sticky Column):** 10-12 `rounded-sm` blocks of varying widths (60-80% of column width).
    - **Timeline:** The `0.0625rem` grid borders remain visible. Randomly placed "placeholder" blocks for absences using `neutral-100`.
- **Visual Style:**
    - Base color: `neutral-100` (#f3f4f6).
    - Animation: `animate-pulse` (subtle, no aggressive shimmer).

## 6. Performance & Edge Cases

- **Virtualization:** Mandatory for teams > 50 members to maintain 60fps scrolling.
- **Empty States:** Minimalist illustration and "Reset filters" button if no users match search/filter criteria.
- **Error Handling:** User-friendly message box with a "Retry" action if API calls fail.

## 7. Color & Status Mapping

| Element | Hex Background | Icon (Lucide) |
| --- | --- | --- |
| **Approved** | `#dcfae7` | `CheckCircle2` |
| **Pending** | `#faf2c8` | `Clock` |
| **Public Holiday** | `#fae6e7` | `Flag` |
| **Today Column** | `#f2f7ff` | - |
| **Weekend Column** | `#f7f9fa` | - |
| **Active Filter** | `#e2f337` | - |
| **Skeleton Base** | `#f3f4f6` | - |

## 8. Technical Implementation Constraints

- **Icons:** Use **Lucide React** only.
- **CSS:** Strictly use `position: sticky` for scroll performance. Cell borders: `0.0625rem` (`neutral-200`).
- **Z-Index Hierarchy:** Sticky Header (10) > Sticky Column (9) > Pills (5) > Tooltips (20).