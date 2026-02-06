# Backend Security & Tenant Isolation Audit
**Latest Version:** v1 | **Date:** 2026-02-06
**Parent:** [00_doc_master.md](00_doc_master.md) | **Dependencies:** [backend-map.md](backend-map.md)

## TL;DR (3 lines max)
> **AI Instruction:** Read ONLY this TL;DR. This audit evaluates session validation, tenant isolation, and RBAC across server actions.

## Audit Results

| Action Name | File | Security Status | Criticality | Detected Issue & Fix |
|-------------|------|-----------------|-------------|----------------------|
| `signOutAction` | `auth.ts` | **Secure** | Low | None. Public utility for session termination. |
| `createUser` | `user.ts` | **Warning** | Medium | **1. Missing Zod Validation:** Parameters are typed but not validated at runtime. <br> **Fix:** Implement Zod schema as per `backend.md` §3. <br> **2. Input Trust:** `contractTypeId` is used without verifying existence. <br> **Fix:** Validate global IDs before database mutation. |

## Detailed Findings

### 1. Tenant Isolation
- **Success:** `createUser` correctly extracts `companyId` from the session and applies it to all relevant queries (`Role`, `Area`, `Department`, `User`, `Audit`, `EmailAudit`).
- **Policy:** The email uniqueness check is global (`prisma.user.findUnique`). This follows the `Auth.js` standard but assumes a user cannot belong to multiple companies with the same email.

### 2. Session & RBAC
- **Success:** `createUser` calls `auth()` and strictly verifies `session.user.isAdmin`.
- **Note:** `signOutAction` is listed as public; no session check is required for terminating the current context.

### 3. Recommendations
- **Zod Schemas:** Standardize all actions in `lib/actions/` to use Zod for parameter validation to prevent malformed injections.
- **Global ID Verification:** For models without `companyId` (like `ContractType`), still perform a "read-before-write" check to ensure the ID is valid and exists in the system.

## Change Log
- **v1:** Initial security audit of `lib/actions/`. - 2026-02-06
