# Phase 1: Foundation & Setup - Task List

## Overview
Initialize the TimeOff Management v2 project with core infrastructure, database schema, and API standards. This phase ensures the application has a solid typesafe foundation before building functional features.

## Prerequisites
- [x] Create [Porting Master Plan](file:///implementation_plan/porting/porting_master_plan.md).
- [x] Read [PRD 12: Database Schema](file:///prd/porting_prd/prd_12_database_schema_and_data_model.md).
- [x] Read [PRD 13: API Specifications](file:///prd/porting_prd/prd_13_API_specifications.md).
- [x] Read [PRD 14: Security & Compliance](file:///prd/porting_prd/prd_14_security_and_compliance.md).

## Detailed Task Breakdown

### 1. Database & ORM Setup (Prisma/Neon)
- [x] **Initialize Prisma**: Run `npx prisma init` and configure for PostgreSQL.
  - **Done looks like**: `prisma` folder exists with `schema.prisma`.
- [x] **Define Core Schema**: Implement models for `Company`, `User`, and `Department` as per PRD 12.
  - **Done looks like**: `schema.prisma` contains the models and compiles.
- [x] **Establish Database Connection**: Configure `.env.local` with Neon connection string.
  - **Done looks like**: `npx prisma db push` (or migrate) succeeds.

### 2. API Response & Error Standards
- [x] **Define API Types**: Create shared TypeScript interfaces for `ApiResponse` and `ApiError` in `lib/types/api.ts`.
  - **Done looks like**: Types exported and matching PRD 13.
- [x] **Implement Error Helper**: Create a utility to generate consistent error responses.
  - **Done looks like**: Helper function returns correctly formatted JSON.

### 3. Authentication & Security (Clerk/Webhooks)
- [x] **Configure Clerk Middleware**: Ensure `middleware.ts` protects all routes except public ones.
  - **Done looks like**: Unauthorized access redirects to login.
- [x] **Setup Webhook Endpoint**: Create `app/api/webhooks/clerk/route.ts` to receive Clerk events.
  - **Done looks like**: Endpoint exists and validates Clerk signature (placeholder logic allowed).
- [x] **User Sync Stub**: Implement basic user creation logic in the webhook to satisfy `user.created`.
  - **Done looks like**: Webhook logs user data when triggered.

### 4. UI Library & Design System
- [x] **Verify shadcn/ui**: Check `components/ui` and ensure core components (Button, Input, Card) are ready.
  - **Done looks like**: `components.json` is configured and components are importable.
- [x] **Setup Theme & Layout**: Configure `index.css` with the design tokens (colors, variables).
  - **Done looks like**: App uses defined primary/secondary colors.

## Acceptance Criteria
- [x] Project builds successfully.
- [x] Prisma schema reflects the foundational entities of the PTO system.
- [x] API routes have a standardized response structure.
- [x] Clerk is protecting routes and webhooks are ready to link users to the Postgres DB.

## Testing & Validation Checklist
- [x] Run `npx prisma generate` to verify type safety.
- [x] Verify `GET /api/me` (stub) returns the standard `ApiResponse` format.
- [x] Manual test of route protection (sign-in/sign-out).
