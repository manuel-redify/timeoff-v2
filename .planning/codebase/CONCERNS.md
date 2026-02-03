# Codebase Concerns

**Analysis Date:** 2026-02-03

## Tech Debt

**Year-spanning leave requests:**
- Issue: Leave validation and allowance calculation don't handle requests spanning multiple years properly
- Files: `lib/leave-validation-service.ts` (line 123), `lib/allowance-service.ts` (line 230)
- Impact: Users requesting leave that crosses year boundaries may get incorrect validation or allowance calculations
- Fix approach: Implement year boundary detection and split calculations/approvals by year

**Approval notification completeness:**
- Issue: Revoking leave requests doesn't notify original approvers
- Files: `app/api/leave-requests/[id]/request-revoke/route.ts` (line 44)
- Impact: Approvers lose visibility when their approved requests are cancelled
- Fix approach: Add notification service integration for revocation events

**Debug file accumulation:**
- Issue: Multiple debug and temporary files committed to repository
- Files: `debug-*.ts`, `test-*.ts`, `check-*.ts`, `*.bak` files in root and scripts/
- Impact: Clutters codebase, potential security risks with debug data
- Fix approach: Move to separate debug directory or remove, add to .gitignore

## Known Bugs

**Allowance breakdown UI missing:**
- Symptoms: Users cannot see detailed breakdown of their leave allowance
- Files: `app/(dashboard)/requests/new/page.tsx` (line 61)
- Trigger: Creating new leave requests
- Workaround: None - UI component placeholder exists but not implemented

## Security Considerations

**Environment variable exposure:**
- Risk: Database credentials and API keys referenced in multiple files
- Files: All files using `process.env.*` (28 matches across lib/, scripts/, app/)
- Current mitigation: .env.example provided but no validation of required vars
- Recommendations: Add runtime validation for critical environment variables, implement secret management

**Development password hardcoded:**
- Risk: Default development password "Welcome2024!" exposed in .env.example
- Files: `.env.example` (line 19)
- Current mitigation: Only for development environment
- Recommendations: Generate random dev passwords, remove from committed files

**Database connection pooling:**
- Risk: No explicit connection pool limits configured
- Files: `lib/prisma.ts`
- Current mitigation: Prisma default pooling
- Recommendations: Configure explicit pool limits based on expected load

## Performance Bottlenecks

**Generated Prisma models size:**
- Problem: Auto-generated model files are extremely large (User.ts 7,734 lines)
- Files: `lib/generated/prisma/models/` directory
- Cause: Complex database schema with many relations
- Improvement path: Consider splitting large models or using partial selects

**Excessive console logging in production:**
- Problem: 27 console.log/error/warn statements in lib/ directory
- Files: `lib/actions/user.ts`, `lib/smtp2go.ts`, `lib/services/notification.service.ts`, etc.
- Cause: Debug logging not removed for production
- Improvement path: Implement proper logging framework with levels

## Fragile Areas

**Leave calculation service:**
- Files: `lib/leave-calculation-service.ts`, `lib/leave-validation-service.ts`
- Why fragile: Complex business logic with multiple edge cases (year boundaries, holidays, schedules)
- Safe modification: Write comprehensive tests before changes, test boundary conditions
- Test coverage: Limited - only basic overlap detection tests exist

**Email service integration:**
- Files: `lib/smtp2go.ts`, `lib/services/notification.service.ts`
- Why fragile: External service dependency with limited error handling
- Safe modification: Implement circuit breaker pattern, add retry logic
- Test coverage: Minimal - relies on external service

**Approval routing logic:**
- Files: `lib/approval-routing-service.ts`
- Why fragile: Complex conditional logic for different company modes
- Safe modification: Document decision matrix, add integration tests
- Test coverage: No dedicated test files found

## Scaling Limits

**Database query patterns:**
- Current capacity: Unknown - no query optimization evident
- Limit: Prisma auto-generated queries may be inefficient for large datasets
- Scaling path: Add query performance monitoring, implement query optimization

**File upload handling:**
- Current capacity: Not detected - no file upload system found
- Limit: Will need robust file handling for attachments
- Scaling path: Plan CDN integration and file size limits

## Dependencies at Risk

**Prisma adapter dependency:**
- Risk: Using `@prisma/adapter-pg` with direct Pool connection
- Impact: Connection management complexity, potential connection leaks
- Migration plan: Consider using standard Prisma client or implement proper connection lifecycle

**Email service vendor lock-in:**
- Risk: Hard-coded SMTP2GO integration
- Impact: Difficult to switch email providers
- Migration plan: Implement email provider abstraction interface

## Missing Critical Features

**Comprehensive test coverage:**
- Problem: Only 1 test file found out of 707 potential test files
- Blocks: Safe refactoring, confidence in deployments
- Files: `tests/overlap-detection.test.ts` is the only test

**Audit trail completeness:**
- Problem: Limited audit logging for critical actions
- Blocks: Compliance requirements, security investigations
- Files: Basic email audit in `lib/actions/user.ts` but no comprehensive system

**Error handling framework:**
- Problem: Inconsistent error handling across services
- Blocks: User experience, debugging capabilities
- Files: Catch blocks with generic console.error throughout codebase

## Test Coverage Gaps

**Critical business logic untested:**
- What's not tested: Leave calculation, approval routing, allowance management
- Files: `lib/leave-calculation-service.ts`, `lib/approval-routing-service.ts`, `lib/allowance-service.ts`
- Risk: Business rule regressions could go undetected
- Priority: High - core functionality

**API endpoints untested:**
- What's not tested: All API routes in app/api/
- Files: Entire `app/api/` directory
- Risk: Backend regressions, integration failures
- Priority: High - user-facing endpoints

**Email service integration untested:**
- What's not tested: Email sending, notification routing
- Files: `lib/smtp2go.ts`, `lib/services/notification.service.ts`
- Risk: Communication failures
- Priority: Medium - external dependency

---

*Concerns audit: 2026-02-03*