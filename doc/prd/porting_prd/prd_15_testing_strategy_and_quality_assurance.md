# PRD 15: Testing Strategy & Quality Assurance

**Document Version:** 1.0  
**Date:** January 13, 2026  
**Status:** Draft  
**Author:** Senior Product Manager / LLM Agent  

---

## Executive Summary

This document defines the comprehensive testing strategy and quality assurance (QA) framework for the TimeOff Management Application v2. As the application transitions to a modern, serverless architecture (Next.js, Neon, Prisma, Clerk), the testing strategy must ensure 100% feature parity with the legacy system while maintaining high reliability and performance in a serverless environment.

---

## 1. Goals and Objectives

### 1.1 Objectives
1.  **Ensuring Feature Parity:** Validate that all v1 features are correctly migrated.
2.  **Reliability:** Ensure core workflows (leave requests, approvals) are bug-free.
3.  **Performance:** Verify that page load times and API responses meet the targets (<2s load, <500ms API).
4.  **Security:** Validate authentication (Clerk) and authorization (RBAC) implementations.
5.  **Maintainability:** Build a test suite that supports continuous integration and rapid iteration.

### 1.2 Success Criteria
- **Unit Test Coverage:** >80% for business logic and utility functions.
- **Critical Path Coverage:** 100% of "Happy Path" workflows (Request submission -> Approval -> Allowance deduction) covered by E2E tests.
- **Zero Critical Bugs:** No high-priority bugs in production releases.
- **Automated Verification:** All tests must pass in the CI/CD pipeline before deployment.

---

## 2. Testing Levels

### 2.1 Unit Testing (Vitest / Jest)
- **Scope:** Individual functions, hooks, and logic-heavy components.
- **Focus:**
    - Allowance calculation logic (PRD 06).
    - Date validation and overlap checking (PRD 04).
    - Utility functions in `/lib/utils`.
- **Requirements:** 
    - Mock external dependencies (Prisma, Clerk).
    - Fast execution to provide immediate feedback during development.

### 2.2 Integration Testing (Vitest + Prisma/Neon)
- **Scope:** Interactions between components and the database.
- **Focus:**
    - Service layer interactions with Prisma.
    - API Route handlers in `/app/api`.
    - Clerk webhook processing.
- **Requirements:**
    - Use a dedicated test database (Neon branch or local PostgreSQL).
    - Reset database state between test runs.

### 2.3 End-to-End (E2E) Testing (Playwright)
- **Scope:** Full user journeys across the UI.
- **Focus:**
    - User login and onboarding.
    - Leave request lifecycle (Submit, Approve, Reject, Cancel).
    - Company and department setup by Admin.
    - Responsive design verification across breakpoints (PRD 11).
- **Requirements:**
    - Tests should run against a staging/preview environment.
    - Include tests for different user roles (Employee, Supervisor, Admin).

### 2.4 Security Testing
- **Focus:**
    - Verification of Row Level Security (RLS) in Neon.
    - Clerk authentication tokens and session management.
    - RBAC: Ensuring Employees cannot access Admin/Supervisor features.
- **Tools:** Manual penetration testing and automated security scanners in CI.

---

## 3. Tooling and Frameworks

| Category | Tool | Rationale |
| :--- | :--- | :--- |
| **Unit/Integration** | [Vitest](https://vitest.dev/) | High performance, native ESM support, compatible with Vite/Next.js. |
| **E2E Testing** | [Playwright](https://playwright.dev/) | Robust cross-browser testing, modern features (auto-waiting, trace viewer). |
| **Mocking** | [MSW (Mock Service Worker)](https://mswjs.io/) | Intercept API requests at the network level for consistent integration testing. |
| **CI/CD** | GitHub Actions | Seamless integration with Vercel and repository management. |
| **Coverage** | C8 / Vitest coverage | Integrated reporting of code coverage. |

---

## 4. Test Scenarios (Selection)

### 4.1 Core Leave Workflow (PRD 04)
- **Scenario 1:** Employee submits a valid vacation request.
    - **Expected:** Request saved, status 'new', allowance "blocked", notification sent to supervisor.
- **Scenario 2:** Supervisor approves a request.
    - **Expected:** Status 'approved', allowance deducted, notification sent to employee.
- **Scenario 3:** Employee tries to request more days than available.
    - **Expected:** Validation error prevented submission.
- **Scenario 4:** Overlapping requests for the same dates.
    - **Expected:** System flags conflict and prevents submission.

### 4.2 Allowance Calculations (PRD 06)
- **Scenario:** Pro-rated allowance for an employee starting mid-year.
    - **Expected:** Logic correctly calculates remaining days based on company start-of-year settings.

### 4.3 Admin Controls (PRD 10)
- **Scenario:** Admin changes company-wide working schedule.
    - **Expected:** New schedule reflected in all subsequent vacation requests and calendar views.

---

## 5. Quality Assurance Workflow

1.  **Local Development:** Developers run unit and integration tests locally before pushing.
2.  **Pull Request (PR):**
    - Linting (ESLint) and Type-checking (TSC).
    - All unit/integration tests run automatically.
3.  **Preview Deployment:** Vercel creates a preview URL.
4.  **E2E Suite:** Playwright tests run against the preview URL.
5.  **Approval:** PR requires all tests to pass and at least one peer review.
6.  **Production:** Post-deployment smoke tests verify critical systems (Clerk, Database connectivity).

---

## 6. Performance and Accessibility QA

### 6.1 Performance Testing (Lighthouse)
- Automated Lighthouse checks in CI to ensure Performance scores >90.
- Verify Largest Contentful Paint (LCP) <2.5s.

### 6.2 Accessibility Testing (axe-core)
- Integrated axe-core checks in Playwright to identify WCAG violations.
- Manual verification of keyboard navigation and screen reader support (PRD 00 / PRD 11).

---

## 7. Configuration & Environment Management

- **`NODE_ENV=test`**: Standard environment for running local tests.
- **Database Shadowing**: Using Prisma's shadow database for safe migrations during test runs.
- **Clerk Test Keys**: Use Clerk's dedicated testing keys to avoid polluting production user data.

---

## 8. Related Documentation
- [PRD 00: Project Overview](file:///Users/manuel/Coding/timeoff-management-application/porting_prd/prd_00_overview.md)
- [PRD 12: Database Schema](file:///Users/manuel/Coding/timeoff-management-application/porting_prd/prd_12_database_schema_and_data_model.md)
- [PRD 13: API Specifications](file:///Users/manuel/Coding/timeoff-management-application/porting_prd/prd_13_API_specifications.md)

---

## Document Change Log

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-01-13 | LLM Agent | Initial testing strategy aligned with v2 tech stack. |

---
*End of PRD 15 - Testing Strategy & Quality Assurance*
