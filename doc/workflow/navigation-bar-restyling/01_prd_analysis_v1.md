# PRD Analysis - Navigation Bar Restyling
**Version:** v1
**Date:** 2026-02-09
**Source PRD:** `doc/prd/prd_navigation_bar_restyling.md`

## 🎯 Objective
Implement a high-utility, modern navigation bar following the Redify Design System. Key focus: neon lime (`#e2f337`) as functional "Highlighter," RBAC-driven visibility, responsive design (Desktop/Mobile), and "Smart Header" scroll behavior.

## 📋 Feature & Logic Map
| ID | Role | Feature | Functional Logic & Requirements | Edge Cases & Error Handling |
|:---|:---|:---|:---|:---|
| F01 | User | Main Nav Links | Dashboard and Team View links always visible. Logo (assets/logo.svg) left-aligned. | |
| F02 | Admin | Admin Nav Links | "Users" and "Settings" icon visible only if `User.isAdmin === true`. | |
| F03 | Approver | Approvals Link | Visible if `pendingApprovalsCount > 0` (status: 0) OR if user is in `DepartmentSupervisor`. | Fallback to skeleton if permission query takes >200ms. |
| F04 | User | New Leave Button | Desktop: Pill-shaped, neon lime bg, black text. Mobile: Encircled "+" icon. | Toggle desktop/mobile variants at breakpoint. |
| F05 | User | Notification Bell | Icon with neon lime badge. Opens right-side drawer. Badge count avoids 0->N flicker. | BellOff icon + "no notifications" text if list is empty. |
| F06 | User | User Avatar | Circle with initials/photo. Dropdown: Full Name, Profile, Logout. | Initials/Avatar skeleton while loading. |
| F07 | User | Smart Header | Sticky top-0. Hide on scroll down (>100px offset), show on scroll up. Canvas bg (#ffffff). | Ensure readability over grid content. |
| F08 | User | Hover/Interactions | Transitions 150ms (ease-in-out). Nav links: neutral-900 text on neutral-100 bg. | Button scale 0.98 on active (click). |
| F09 | User | Skeleton States | Show pill/circle skeletons (`neutral-100`) for async elements if >200ms loading. | Prevent Cumulative Layout Shift (CLS). |
| F10 | User | Mobile Burger | Header: [Logo] --- [New Leave icon] [Bell] [Burger]. Burger opens drawer with "Settings" moved inside. | Touch targets min 3.75rem (60px). |

## 🏗️ Data Entities (Domain Model)
- **User:** `isAdmin` (Boolean), `id` (UUID), `fullName` (String).
- **ApprovalStep:** `approverId` (FK), `status` (Enum/Int: 0 for Pending).
- **DepartmentSupervisor:** `userId` (FK).
- **Notification:** `content`, `createdAt`.

## 🔗 Dependencies & Blockers
- **Internal:** F03 requires `ApprovalStep` and `DepartmentSupervisor` queries (see PRD §10).
- **External:** `Inter` font availability. Assets `assets/logo.svg` and `assets/logo-icon.svg` must exist.
- **Assets:** Need to verify favicon implementation using `assets/logo-icon.svg`.

## 🔧 Technical Stack & Constraints
- **Stack:** Inter font, SVG assets, Prisma ORM.
- **Colors:** Primary (Neon Lime) `#e2f337`, Hover BG `#d4e62e`, Canvas `#ffffff`, Neutral palette (100, 200, 400, 900).
- **Transitions:** `150ms ease-in-out`.
- **Accessibility:** `role="navigation"`, `aria-label` for icons, `Esc` key to close drawers/dropdowns.
- **Radius:** `rounded-full` (buttons, active links, avatars).
- **Borders:** `0.0625rem` (1px) solid `neutral-200`.

## 🚫 Scope Boundaries
- **In-Scope:** Navbar styling, visibility logic, notification DRAWER structure, mobile menu, favicon update, smart header scroll logic.
- **Out-of-Scope:** Notification BACKEND sending logic (assumes drawer displays existing data), Profile/Logout PAGE implementation (only the menu triggers).

## ❓ Clarifications Needed
1.  **Mobile Breakpoint:** Is there a specific tailwind/CSS breakpoint (e.g., 768px/md) for the "New Leave" button switch?
2.  **Notification Drawer:** Does it need its own API route or is it fed via props/context from the main layout?
3.  **Approvals Logic:** Should the count be real-time (WebSockets) or recalculated on navigation/intervals?
