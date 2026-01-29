# Task Checklist - Task 3.3: Update Admin User Management UI
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m3_v1.md

## ✅ Task Checklist - Task 3.3: Update Admin User Management UI

### Steps
- [ ] Create `components/admin/create-user-modal.tsx`:
    - [ ] Use `Dialog` component (or similar) for a modal interface
    - [ ] Build the form with: `firstName`, `lastName`, `email`, `department`, `role`, `area`, `country`, `contractType`, `isAdmin`, `endDate`
    - [ ] Add `useActionState` (or `useFormState`) to handle the `createUser` server action
    - [ ] Implement client-side validation (simple checks)
- [ ] Update `app/(dashboard)/admin/users/page.tsx`:
    - [ ] Fetch `areas` from Prisma: `await prisma.area.findMany({ where: { deletedAt: null } })`
    - [ ] Import and include the `CreateUserModal` component
    - [ ] Add a "Create User" or "Add Employee" button to trigger the modal
- [ ] Update `components/admin/user-list-table.tsx` (if needed):
    - [ ] Add the "Add Employee" button next to the search/filter area if more appropriate than the main page
- [ ] Implement feedback UI:
    - [ ] Success toast notification with a "View User" link
    - [ ] Error alert with the specific error message from the server action
- [ ] Ensure consistent styling with the existing Admin UI (premium look, Tailwind colors)

### Testing
- [ ] **Form Validation**: Submit empty form, invalid email. Expected: Client-side errors.
- [ ] **Modal Lifecycle**: Open modal, fill partially, close, open again. Expected: Form reset (or logical state persistence).
- [ ] **Success Flow**: Submit valid form. Expected: Modal closes, success toast appears, list refreshes (via `router.refresh()`), and new user appears in the table.
- [ ] **Error Handling**: Simulate server error (e.g., duplicate email). Expected: Error message displayed inside the modal.

### Done When
- [ ] Admins can create new users directly from the User Management dashboard
- [ ] The creation process is intuitive, responsive, and provides clear feedback
- [ ] Multi-tenancy and data integrity (roles/areas/departments) are respected in the UI
