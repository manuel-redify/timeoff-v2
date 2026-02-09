# Checklist - Task 2.3: Redesign User Avatar with dropdown menu
**Parent:** `02_detailed_m2_navigation-bar-restyling.md`

### Steps
- [x] Step 1: Create or update a circular `Avatar` component (e.g., using `radix-ui` or custom) to display user initials or photo.
- [x] Step 2: Implement `hover` state: `0.0625rem` solid `primary` (#e2f337) border.
- [x] Step 3: Implement the dropdown menu trigger using the Avatar.
- [x] Step 4: Add dropdown items:
    - User's Full Name (Display only, styled differently).
    - "Profile" link.
    - "Logout" action (wrapping the existing `signOutAction`).
- [x] Step 5: Add accessibility Logic:
    - Close dropdown with `Esc`.
    - Trap focus within dropdown when open (if using a library like Radix, this is automatic).
- [x] Step 6: Verify dropdown positioning and responsive behavior.
- [x] Step 7: Apply `neutral-100` circular skeleton for loading state.

### Done When
- [x] Avatar displays correctly with initials or image.
- [x] Hover border is neon lime.
- [x] Dropdown reveals full name, profile link, and logout.
- [x] Logout action successfully signs the user out.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
