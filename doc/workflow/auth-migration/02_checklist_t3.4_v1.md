# Task Checklist - Task 3.4: Implement Login Page UI
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m3_v1.md, doc/prd/prd_auth_migration.md

## ✅ Task Checklist - Task 3.4: Implement Login Page UI

### Steps
- [x] Create/Update `app/login/page.tsx`:
    - [x] Design a premium login layout (centered card, subtle background, company branding)
    - [x] Implement "Sign in with Google" button:
        - [x] Always visible in `production`
        - [x] Visibility in `development` based on `ENABLE_OAUTH_IN_DEV` env var
        - [x] Use `signIn("google")` from `next-auth/react`
    - [x] Implement Credentials form:
        - [x] Visible only in `development` environment
        - [x] Email and Password fields
        - [x] Use `signIn("credentials", { email, password, redirect: false })`
- [x] Handle Authentication Errors:
    - [x] Extract errors from search parameters (`?error=...`)
    - [x] Map error codes to user-friendly messages (e.g., `OAuthAccountNotLinked` -> "Email already used with a different provider")
    - [x] Display prominent error alert at the top of the form
- [x] Implement Loading States:
    - [x] Disable buttons and show spinners during sign-in process
- [x] Ensure Responsive Design:
    - [x] Full-width on mobile, bounded card on desktop
- [x] (Optional) Add decorative elements (e.g., product screenshots or abstract gradients) for a "wow" factor

### Testing
- [ ] **Google Login (Prod/Dev)**: Click button, verify redirect to Google consent screen.
- [ ] **Credentials Login (Dev)**: Attempt login with valid/invalid creds. Verify behavior.
- [ ] **Environment Logic**: Verify Credentials form is hidden in a simulated production environment.
- [ ] **Error Handling**: Manually navigate to `/login?error=AccessDenied`. Verify the error alert is visible and readable.
- [ ] **Visual Polish**: Verify the UI matches the project's premium aesthetic (consistent with Admin Dashboard).

### Done When
- [x] The login page is functional as the primary entry point for all users
- [x] Conditional provider visibility (Dev vs Prod) is respected
- [x] The design feels modern, secure, and professional
- [x] All auth errors are handled gracefully and communicated clearly to the user
