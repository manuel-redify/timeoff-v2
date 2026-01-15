# Phase 13: Final Testing & Deployment - Task List

## Overview
This final phase ensures the application is production-ready, fully tested, and deployed to a scalable infrastructure. It establishes the CI/CD pipeline, comprehensive test suites (Unit, Integration, E2E), and the production environment on Vercel and Neon.

## Prerequisites
- [ ] Phases 1 through 12 completed.
- [ ] Application achieves feature parity with v1.
- [ ] Read and understood [PRD 15: Testing Strategy & QA](file:///prd/porting_prd/prd_15_testing_strategy_and_quality_assurance.md).
- [ ] Read and understood [PRD 16: Deployment & DevOps](file:///prd/porting_prd/prd_16_deployment_and_devops.md).

## Detailed Task Breakdown

### 1. Testing Infrastructure & Automated Suites
- [ ] **Configure Testing Frameworks**: Install and set up Vitest (Unit/Integration) and Playwright (E2E).
  - **Done looks like**: Running `npm test` and `npx playwright test` works locally with sample tests.
- [ ] **Implement Unit Test Suite**: Build coverage for allowance calculations, date validations, and utility functions.
  - **Done looks like**: >80% coverage on business logic with mocked Prisma/Clerk.
- [ ] **Implement Integration Test Suite**: Build tests for API routes and Prisma service layers.
  - **Done looks like**: Verified DB interactions using a dedicated test database (Neon branch).
- [ ] **Implement E2E User Journeys**: Create Playwright scripts for critical flows (Onboarding, Request -> Approval -> Deduction).
  - **Done looks like**: Automated flows pass reliably for Employee, Supervisor, and Admin roles.
- [ ] **Automated Security & Accessibility**: Integrate axe-core for a11y and RBAC checks for security into Playwright.
  - **Done looks like**: Tests catch WCAG violations and unauthorized route access.

### 2. DevOps & Deployment Pipeline
- [ ] **Establish GitHub Actions CI/CD**: Create workflows for Linting, Type-checking, Testing, and Deployment triggers.
  - **Done looks like**: Every PR triggers automated checks; merges to `main` or `staging` trigger Vercel deployments.
- [ ] **Environment & Branching Setup**: Configure Vercel projects and Neon database branches (Dev, Staging, Prod).
  - **Done looks like**: Three distinct environments with isolated data and Clerk instances.
- [ ] **Secret Management**: Set up environment variables across all Vercel environments.
  - **Done looks like**: All keys (Resend, Clerk, Database) are securely configured and verified.
- [ ] **Database Migration Strategy**: Configure `prisma migrate deploy` in the Vercel build command.
  - **Done looks like**: Production migrations run automatically during deployment.

### 3. Monitoring & Final Polish
- [ ] **Enable Monitoring & Observability**: Integrate Sentry (error tracking) and Vercel Analytics.
  - **Done looks like**: Errors and performance metrics are visible in the respective dashboards.
- [ ] **Performance Audit (Lighthouse)**: Run final Lighthouse check to ensure scores >90.
  - **Done looks like**: Application meets LCP (<2.5s) and other Core Web Vitals targets.
- [ ] **Post-Deployment Smoke Tests**: Execute manual and automated verification on the live production environment.
  - **Done looks like**: Final confirmation that all systems (Mail, Auth, DB) are functional in production.

## Acceptance Criteria
- [ ] Zero high-priority bugs in the production environment.
- [ ] All automated tests pass in the CI pipeline without flakes.
- [ ] 100% of "Happy Path" workflows are verified by E2E tests.
- [ ] Production application is accessible at the public URL with valid SSL and DKIM/SPF records.
- [ ] Performance and Accessibility scores meet PRD 15/16 targets.

## Testing & Validation Checklist
- [ ] Run full test suite (`npm run test:all`) and verify green status.
- [ ] Manual verification of the Clerk signup -> Database sync on the production URL.
- [ ] Verify Resend email delivery for any request on production.
- [ ] Check Sentry dashboard for any caught errors during the smoke test.
- [ ] Confirm database backups are enabled and functioning in Neon.
