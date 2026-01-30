# Task Checklist - Task 4.4 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m4_v1.md

## ✅ Task Checklist - Task 4.4: Update documentation

### Steps
- [x] **README Updates:**
    - [x] Remove Clerk-specific setup steps.
    - [x] Add Auth.js installation and initialization instructions.
    - [x] List all required environment variables for Auth.js and SMTP2GO.
- [x] **OAuth Guide:**
    - [x] Create `doc/05_google_oauth_setup.md`.
    - [x] Include screenshots or step-by-step instructions for Google Cloud Console.
    - [x] Define required scopes (`openid`, `profile`, `email`) and authorized redirect URIs.
- [x] **Workflow Documentation:**
    - [x] Update internal developer docs to reflect the new "Admin-only" invite flow.
    - [x] Document the database strategy for sessions and how to manually revoke access via Prisma.
- [x] **Final Review:**
    - [x] Ensure all referenced `.md` files in `doc/workflow/` are updated to their final versions.

### Testing
- [x] Verify that a new developer can set up the project auth using the updated `README.md`.
- [x] Check links between documentation files for broken references.

### Done When
- [x] `README.md` reflects the current Auth.js state.
- [x] A dedicated guide exists for Google OAuth setup.
- [x] Internal workflows for user management are fully documented.
