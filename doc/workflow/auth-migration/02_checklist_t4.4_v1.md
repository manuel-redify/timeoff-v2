# Task Checklist - Task 4.4 - Auth Migration
**Version:** v1
**Date:** 2026-01-29
**Source:** doc/workflow/auth-migration/02_detailed_m4_v1.md

## ✅ Task Checklist - Task 4.4: Update documentation

### Steps
- [ ] **README Updates:**
    - [ ] Remove Clerk-specific setup steps.
    - [ ] Add Auth.js installation and initialization instructions.
    - [ ] List all required environment variables for Auth.js and SMTP2GO.
- [ ] **OAuth Guide:**
    - [ ] Create `doc/05_google_oauth_setup.md`.
    - [ ] Include screenshots or step-by-step instructions for Google Cloud Console.
    - [ ] Define required scopes (`openid`, `profile`, `email`) and authorized redirect URIs.
- [ ] **Workflow Documentation:**
    - [ ] Update internal developer docs to reflect the new "Admin-only" invite flow.
    - [ ] Document the database strategy for sessions and how to manually revoke access via Prisma.
- [ ] **Final Review:**
    - [ ] Ensure all referenced `.md` files in `doc/workflow/` are updated to their final versions.

### Testing
- [ ] Verify that a new developer can set up the project auth using the updated `README.md`.
- [ ] Check links between documentation files for broken references.

### Done When
- [ ] `README.md` reflects the current Auth.js state.
- [ ] A dedicated guide exists for Google OAuth setup.
- [ ] Internal workflows for user management are fully documented.
