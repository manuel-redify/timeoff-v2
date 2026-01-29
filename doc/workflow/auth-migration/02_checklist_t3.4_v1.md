# Task Checklist - Task 3.4: Implement Login Page UI
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m3_v1.md, doc/prd/prd_auth_migration.md

## ✅ Task Checklist - Task 3.4: Implement Login Page UI

### Steps
- [ ] Create/Update `app/login/page.tsx`:
    - [ ] Design a premium login layout (centered card, subtle background, company branding)
    - [ ] Implement "Sign in with Google" button:
        - [ ] Always visible in `production`
        - [ ] Visibility in `development` based on `ENABLE_OAUTH_IN_DEV` env var
        - [ ] Use `signIn("google")` from `next-auth/react`
    - [ ] Implement Credentials form:
        - [ ] Visible only in `development` environment
        - [ ] Email and Password fields
        - [ ] Use `signIn("credentials", { email, password, redirectTo: "/" })`
- [ ] Handle Authentication Errors:
    - [ ] Extract errors from search parameters (`?error=...`)
    - [ ] Map error codes to user-friendly messages (e.g., `OAuthAccountNotLinked` -> "Email already used with a different provider")
    - [ ] Display prominent error alert at the top of the form
- [ ] Implement Loading States:
    - [ ] Disable buttons and show spinners during sign-in process
- [ ] Ensure Responsive Design:
    - [ ] Full-width on mobile, bounded card on desktop
- [ ] (Optional) Add decorative elements (e.g., product screenshots or abstract gradients) for a "wow" factor

### Testing
- [ ] **Google Login (Prod/Dev)**: Click button, verify redirect to Google consent screen.
- [ ] **Credentials Login (Dev)**: Attempt login with valid/invalid creds. Verify behavior.
- [ ] **Environment Logic**: Verify Credentials form is hidden in a simulated production environment.
- [ ] **Error Handling**: Manually navigate to `/login?error=AccessDenied`. Verify the error alert is visible and readable.
- [ ] **Visual Polish**: Verify the UI matches the project's premium aesthetic (consistent with Admin Dashboard).

### Done When
- [ ] The login page is functional as the primary entry point for all users
- [ ] Conditional provider visibility (Dev vs Prod) is respected
- [ ] The design feels modern, secure, and professional
- [ ] All auth errors are handled gracefully and communicated clearly to the user
