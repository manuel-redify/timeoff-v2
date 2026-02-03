# Architecture

**Analysis Date:** 2026-02-03

## Pattern Overview

**Overall:** Next.js Full-Stack Application with Service Layer Architecture

**Key Characteristics:**
- Next.js 16 with App Router for SSR and API routes
- Service layer separation for business logic
- Prisma ORM with PostgreSQL database
- Role-based access control (RBAC) system
- Authentication via NextAuth.js with multiple providers

## Layers

**Presentation Layer (Frontend):**
- Purpose: React components and UI rendering
- Location: `app/`, `components/`
- Contains: Page components, UI components, client-side logic
- Depends on: Service layer via API calls
- Used by: End users through web browser

**API Layer:**
- Purpose: HTTP endpoints and request/response handling
- Location: `app/api/`
- Contains: Route handlers, validation, authorization
- Depends on: Service layer for business logic
- Used by: Frontend components

**Service Layer:**
- Purpose: Business logic and domain operations
- Location: `lib/services/`, `lib/`
- Contains: Domain services, validation, calculations
- Depends on: Database layer (Prisma)
- Used by: API layer and other services

**Database Layer:**
- Purpose: Data persistence and querying
- Location: `lib/generated/prisma/`, `prisma/`
- Contains: ORM models, migrations, schema
- Depends on: PostgreSQL database
- Used by: Service layer

## Data Flow

**Leave Request Creation:**

1. User submits form via frontend component
2. Frontend calls `POST /api/leave-requests`
3. API route validates request via `LeaveValidationService`
4. Service layer determines approval routing via `ApprovalRoutingService`
5. Database transaction creates leave request and approval steps
6. Async notifications sent via `NotificationService`

**Authentication Flow:**

1. User visits `/login`
2. NextAuth.js handles authentication (Google/Credentials)
3. Session stored in database via Prisma adapter
4. Auth state provided to frontend via SessionProvider
5. API routes protected via `requireAuth()` middleware

## Key Abstractions

**LeaveRequest:**
- Purpose: Core domain entity for time off requests
- Examples: `app/api/leave-requests/route.ts`, `lib/leave-validation-service.ts`
- Pattern: Rich domain model with validation service

**ApprovalFlow:**
- Purpose: Multi-step approval process with delegation
- Examples: `lib/services/approval.service.ts`, `lib/approval-routing-service.ts`
- Pattern: Workflow service with routing rules

**User/Role:**
- Purpose: Authentication and authorization
- Examples: `lib/rbac.ts`, `auth.ts`
- Pattern: Role-based access control with hierarchical permissions

## Entry Points

**Web Application:**
- Location: `app/layout.tsx`
- Triggers: HTTP requests to domain root
- Responsibilities: Global layout, authentication providers, error boundaries

**API Endpoints:**
- Location: `app/api/`
- Triggers: HTTP requests to `/api/*` paths
- Responsibilities: Request handling, validation, business logic orchestration

**Authentication:**
- Location: `auth.ts`
- Triggers: NextAuth.js authentication events
- Responsibilities: Session management, provider configuration, JWT handling

## Error Handling

**Strategy:** Centralized error handling with validation services

**Patterns:**
- Validation services return structured error objects
- API routes use `handleAuthError()` for consistent error responses
- Frontend uses error boundaries for catch-all error handling
- Async operations wrapped in try-catch with logging

## Cross-Cutting Concerns

**Logging:** Console-based logging with structured prefixes
**Validation:** Centralized in validation services with consistent error format
**Authentication:** NextAuth.js middleware + custom RBAC system
**Authorization:** Role-based checks via `lib/rbac.ts`

---

*Architecture analysis: 2026-02-03*