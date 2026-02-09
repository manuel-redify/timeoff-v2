# PRD: Redify Navigation Bar Restyling

## 1. Objective & Design Narrative

Implement the restyling of the top navigation bar according to the **Redify Design System**. The interface must convey a sense of "Modern High-Utility Productivity," utilizing neon lime (`#e2f337`) as the primary functional color (Highlighter) to draw focus to key actions.

## 2. Components & Visibility Logic (RBAC)

The Navbar is divided into three logical sections:

### A. Left & Center Side (Main Navigation)

1. **Logo:** Use the file `assets/logo.svg`. Left-aligned and always visible.
2. **Dashboard:** Link to the user's summary page. Always visible.
3. **Team View:** Link to the calendar/wall chart view. Always visible.
4. **Users (Admin Only):** Visible only if `User.isAdmin === true`.
5. **Approvals (Dynamic):** Visible if the user has pending requests to approve or is a supervisor.
    - *Logic:* Query `ApprovalStep` (pending status) or check if the user exists in `DepartmentSupervisor`.

### B. Right Side (Actions & Profile)

1. **"New Leave" Button:**
    - *Desktop:* Pill-shaped button with `primary` background (#e2f337) and black text.
    - *Mobile:* Encircled "+" (Plus) icon to save space.
2. **Notification Bell:** Icon with a neon lime badge. Clicking it opens a **Right Side Drawer** for notification history management.
3. **Settings Icon (Admin Only):** Visible only if `User.isAdmin === true`.
4. **User Avatar:** Circle with initials.
    - *Desktop:* Dropdown menu including: *Full Name*, *Profile*, and *Logout*.
    - *Mobile:* Moved inside the Burger Drawer (see Section 9).

## 3. Desktop Interactions (Hover States)

| Element | Idle State | Hover State | Active State |
| --- | --- | --- | --- |
| **Nav Links** | `neutral-400` text | `neutral-100` BG, `neutral-900` text | `#f2f3f5` BG, Bold `neutral-900` text |
| **Primary Button** | BG `#e2f337` | BG `#d4e62e` (darker/more saturated) | Slight contraction (scale 0.98) |
| **Icons (Bell/Set)** | `neutral-400` text | `neutral-100` BG, `neutral-900` icon | - |
| **Avatar** | Initials/Photo only | `0.0625rem` solid `primary` border | - |

*Note: All transitions should last `150ms` with `ease-in-out` easing.*

## 4. Technical Specifications & UI

- **Container Logic (Crucial):** Navigation elements must NOT span the full viewport width. They must be wrapped in a centered container with a `max-width` of **90rem (1440px)** to align perfectly with the main content grid.
- **Borders:** `0.0625rem` (1px) solid `neutral-200`.
- **Radius:** `rounded-sm` for buttons, active links, and avatars.
- **Typography:** `Inter`. Links in `medium` (500), Active links in `bold` (700).
- **No Shadows:** Visual separation relies exclusively on thin borders and background color changes.
- **Favicon:** Use `assets/logo-icon.svg` as the site's favicon.

## 5. Scroll Behavior (Smart Header)

- **Hide on Scroll:** The Navbar disappears upwards during downward scrolling (after a 100px offset).
- **Show on Scroll Up:** The Navbar reappears instantly as soon as the user scrolls up.
- **State:** `sticky top-0`. Solid `canvas` background (#ffffff) with a `neutral-200` bottom border.

## 6. Loading Strategy (Skeleton States)

- **Dynamic Nav Links:** Show a pill-shaped skeleton `neutral-100` (e.g., `w-20`) if permissions checks take >200ms.
- **User Avatar:** Show a circular skeleton `neutral-100` during initials/image loading.
- **Notification Badge:** Only show once the count is ready.

## 7. Notification Drawer & Empty States

- **Structure:** Right-side slide-out panel (overlay).
- **Empty State:** If `notifications.length === 0`, display a centered `BellOff` icon and "You have no new notifications" text.

## 8. Accessibility (A11y)

- **Roles:** `role="navigation"` for the main bar.
- **Labels:** Descriptive `aria-label` for icons.
- **Keyboard:** Focus management (Tab) and `Esc` to close overlays.

## 9. Responsive Behavior (Mobile)

- **Header Layout:** `[Logo] --- [New Leave Icon] [Bell Icon] [Burger Icon]`.
- **The Burger Drawer:** Opens a side panel containing:
    1. **User Profile Section (Top):** * A dedicated header block within the drawer.
        - Displays the **Avatar** (larger than desktop), **Full Name**, and **Email**.
        - Separated from navigation links by a `0.0625rem` border.
    2. **Navigation Links:** Dashboard, Team View, Approvals (dynamic).
    3. **App Settings:** "Users" and "Settings" links (Admin only).
    4. **Account Actions:** "Profile" and "Logout" items, placed at the bottom or grouped under the user section.
- **Touch Targets:** Minimum height of `3.75rem` (60px) for all menu items.

## 10. Database Logic (Prisma)

// Logic for "Approvals" link visibility
const pendingApprovalsCount = await prisma.approvalStep.count({
  where: { approverId: currentUser.id, status: 0 } // 0 = Pending
});

const isSupervisor = await prisma.departmentSupervisor.findFirst({
  where: { userId: currentUser.id }
});

const showApprovals = pendingApprovalsCount > 0 || !!isSupervisor;