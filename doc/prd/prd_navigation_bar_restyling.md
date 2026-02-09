# PRD: Navigation Bar Restyling

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
4. **User Avatar:** Circle with initials. Dropdown menu including: *Full Name*, *Profile*, and *Logout*.

## 3. Desktop Interactions (Hover States)

| Element | Idle State | Hover State | Active State |
| --- | --- | --- | --- |
| **Nav Links** | `neutral-400` text | `neutral-100` BG, `neutral-900` text | `#f2f3f5` BG, Bold `neutral-900` text |
| **Primary Button** | BG `#e2f337` | BG `#d4e62e` (darker/more saturated) | Slight contraction (scale 0.98) |
| **Icons (Bell/Set)** | `neutral-400` text | `neutral-100` BG, `neutral-900` icon | - |
| **Avatar** | Initials/Photo only | `0.0625rem` solid `primary` border | - |

*Note: All transitions should last `150ms` with `ease-in-out` easing.*

## 4. Technical Specifications & UI

- **Borders:** `0.0625rem` (1px) solid `neutral-200`.
- **Radius:** `rounded-full` for buttons, active links, and avatars.
- **Typography:** `Inter`. Links in `medium` (500), Active links in `bold` (700).
- **No Shadows:** Visual separation relies exclusively on thin borders and background color changes.
- **Favicon:** Use `assets/logo-icon.svg` as the site's favicon.

## 5. Scroll Behavior (Smart Header)

To maximize vertical space for the "Team View":

- **Hide on Scroll:** The Navbar disappears upwards during downward scrolling (after a 100px offset).
- **Show on Scroll Up:** The Navbar reappears instantly as soon as the user scrolls up.
- **State:** `sticky top-0`. Solid `canvas` background (#ffffff) to ensure readability over grid content.

## 6. Loading Strategy (Skeleton States)

To prevent Cumulative Layout Shift (CLS):

- **Dynamic Nav Links:** Show a pill-shaped skeleton `neutral-100` (e.g., `w-20`) if permissions checks take >200ms.
- **User Avatar:** Show a circular skeleton `neutral-100` during initials/image loading.
- **Notification Badge:** Only show once the count is ready (avoid 0 -> N flickering).

## 7. Notification Drawer & Empty States

- **Structure:** Right-side slide-out panel (overlay).
- **Empty State:** If `notifications.length === 0`, display a centered icon (e.g., `BellOff`) in `neutral-200` and "You have no new notifications" text in `neutral-400`.
- **Interaction:** Each notification item should have a `0.0625rem` bottom border and a `neutral-50` hover state.

## 8. Accessibility (A11y)

- **Roles:** `role="navigation"` for the main bar.
- **Labels:** Descriptive `aria-label` for icons (e.g., "Open notifications", "Settings").
- **Keyboard:** Sequential focus management (Tab) and ability to close Drawer/Dropdown with the `Esc` key.

## 9. Responsive Behavior (Mobile)

- **Header:** Layout: `[Logo] --- [New Leave Icon] [Bell Icon] [Burger Icon]`.
- **Burger Menu:** Side drawer with text links. "Settings" is moved inside here.
- **Touch Targets:** Minimum height of `3.75rem` (60px) for all mobile menu items.

## 10. Database Logic (Prisma)

// Logic for "Approvals" link visibility
const pendingApprovalsCount = await prisma.approvalStep.count({
  where: { approverId: currentUser.id, status: 0 } // 0 = Pending
});

const isSupervisor = await prisma.departmentSupervisor.findFirst({
  where: { userId: currentUser.id }
});

const showApprovals = pendingApprovalsCount > 0 || !!isSupervisor;