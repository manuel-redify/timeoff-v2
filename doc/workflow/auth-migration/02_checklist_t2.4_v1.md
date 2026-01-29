# Task Checklist - Task 2.4: Implement Middleware
**Version:** v1
**Date:** 2026-01-28
**Source:** doc/workflow/auth-migration/02_detailed_m2_v1.md

## ✅ Task Checklist - Task 2.4

### Steps
- [x] 1. Check for existing `proxy.ts` or `src/proxy.ts`.
- [x] 2. Replace content with Auth.js export (or create new if missing):
   ```typescript
   export { auth as proxy } from "./auth"
   ```
- [x] 3. Define the `config` object with a `matcher` to strictly define protected routes.
   - Suggest starting with broad protection for admin/dashboard but excluding public assets.
   - Pattern: `["/((?!api|_next/static|_next/image|favicon.ico).*)"]` vs specific paths `["/dashboard/:path*", "/admin/:path*"]`?
   - **Decision:** Use specific paths for now as per PRD: `["/dashboard/:path*", "/admin/:path*", "/api/actions/:path*"]`.
- [x] 4. Verify import alias `@/auth` matches the location of `auth.ts` created in Task 2.3.

### Testing
- [x] Manual: Visit `/dashboard` (link usually hidden, but direct URL). Should redirect to `/login` (or default signin page).
- [x] Manual: Visit `/` (public). Should allow access.

### Done When
- [x] `proxy.ts` is using `auth` from `auth.ts`.
- [x] Protected routes are defined in matcher.
