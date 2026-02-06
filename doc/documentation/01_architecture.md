# Project Architecture
**Latest Version:** v4 | **Date:** 2026-02-06
**Parent:** [00_doc_master.md](00_doc_master.md) | **Dependencies:** None

## TL;DR (3 lines max)
> **AI Instruction:** Read ONLY this TL;DR. If NOT relevant to the current task, stop reading the file immediately to save tokens.
Comprehensive overview of the Timeoff Management system architecture, tech stack (Next.js, Prisma, Auth.js), and core implementation patterns (Service Layer, RBAC).

## Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (v16.1.1)
- **Runtime:** Node.js
- **Database:** PostgreSQL (via Prisma v7.2.0)
- **Authentication:** [Auth.js](https://authjs.dev/) (NextAuth v5.0.0-beta.30)
- **Styling:** Tailwind CSS (v4)
- **UI Components:** Radix UI / Shadcn UI
- **Deployment:** Vercel (recommended)

## Directory Structure
```text
├── app/                  # Next.js App Router (Dashboard, API, Auth)
│   ├── (dashboard)/      # Protected dashboard routes
│   ├── api/              # Backend API endpoints
│   └── login/            # Authentication pages
├── components/           # Shared UI components (Radix, Shadcn)
├── doc/                  # Documentation and development guides
│   ├── ai_rules/         # System instructions and coding standards
│   └── documentation/    # Technical documentation (SSOT)
├── emails/               # React Email templates for notifications
├── hooks/                # Custom React hooks (UI and logic)
├── lib/                  # Core logic and utilities
│   ├── actions/          # Server Actions
│   ├── generated/        # Prisma client and types
│   ├── hooks/            # Logic-specific React hooks
│   ├── services/         # Business logic (Service Layer)
│   └── types/            # Library-specific TypeScript types
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── scripts/              # Maintenance and recovery scripts
├── tests/                # Automated test suites (Jest/Vitest)
├── types/                # Global TypeScript definitions
├── .env.example          # Template for environment variables
└── README.md             # Project quick start and links
```

## Core Patterns

### Service Layer
Business logic is encapsulated in a service layer located in `lib/`. Services are responsible for data validation, complex calculations, and database interactions.
- `allowance-service.ts`: Handles leave allowance calculations.
- `approval-routing-service.ts`: Manages the complex approval workflow.
- `leave-validation-service.ts`: Enforces business rules for leave requests.

### Authentication & Authorization
- **Authentication:** Handled by Auth.js using Prisma adapter. Supports OAuth (Google) and Credentials (Email/Password).
- **RBAC (Role-Based Access Control):** Permissions are tied to `Role` models. Critical logic uses `lib/rbac.ts` to enforce access levels.

### API & Data Fetching
- **Server Components:** Fetch data directly via Prisma in page components when possible.
- **API Routes:** Used for client-side interactions and external integrations (located in `app/api/`).
- **Server Actions:** Perform data mutations (located in `lib/actions/`).

## Macro Flows

### Leave Request Lifecycle
1. **Initiation:** User submits a request via the dashboard.
2. **Validation:** `leave-validation-service` checks for overlaps and allowance limits.
3. **Routing:** `approval-routing-service` identifies the necessary approvers based on `ApprovalRules`.
4. **Approval:** Approvers are notified (via email/badge) and can approve/reject.
5. **Completion:** Once fully approved, the status is updated, and the user is notified.

## Change Log
- **v4:** Removed legacy `lib/supabase` folder and references - 2026-02-06
- **v3:** Refined `lib` directory subfolders (hooks, supabase, types) - 2026-02-06
- **v2:** Added comprehensive directory structure (emails, hooks, tests, types) - 2026-02-06
- **v1:** Initial architecture documentation - 2026-02-06
