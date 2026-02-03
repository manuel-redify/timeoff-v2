# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
timeoff-v2/
├── app/                     # Next.js App Router pages and API routes
├── components/              # React components organized by feature
├── lib/                    # Core business logic and utilities
├── prisma/                 # Database schema and migrations
├── emails/                 # Email templates
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── scripts/                # Database scripts and utilities
├── tests/                  # Test files
├── public/                 # Static assets
└── .planning/              # Planning documents
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router structure with pages and API routes
- Contains: Page components, API route handlers, layouts
- Key files: `layout.tsx`, `auth.ts`, `api/` subdirectories

**components/:**
- Purpose: Reusable React components organized by domain
- Contains: UI components, feature components, providers
- Key files: `ui/`, `admin/`, `auth/`, `requests/` subdirectories

**lib/:**
- Purpose: Core business logic and shared utilities
- Contains: Services, helpers, database client, utilities
- Key files: `prisma.ts`, `services/`, `actions/`

**prisma/:**
- Purpose: Database schema definition and migrations
- Contains: Schema file, migration history, RLS policies
- Key files: `schema.prisma`, `migrations/`

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout with auth providers
- `auth.ts`: NextAuth.js configuration
- `lib/prisma.ts`: Database client singleton

**Configuration:**
- `prisma/schema.prisma`: Database schema definition
- `package.json`: Dependencies and scripts
- `.env.example`: Environment variable template

**Core Logic:**
- `lib/services/`: Business logic services
- `lib/leave-validation-service.ts`: Leave request validation
- `lib/approval-routing-service.ts`: Approval workflow logic
- `app/api/`: API route handlers

**Testing:**
- `tests/`: Test files (limited coverage)
- `scripts/test-*.ts`: Various test utilities

## Naming Conventions

**Files:**
- kebab-case for directories: `user-management/`
- kebab-case for components: `leave-request-form.tsx`
- kebab-case for API routes: `leave-requests/route.ts`
- kebab-case for services: `approval.service.ts`

**Directories:**
- Feature-based grouping: `components/requests/`
- Shared UI: `components/ui/`
- Domain services: `lib/services/`
- Type definitions: `lib/types/`

## Where to Add New Code

**New Feature:**
- Primary code: `lib/services/[feature].service.ts`
- API endpoints: `app/api/[feature]/route.ts`
- Frontend components: `components/[feature]/`
- Page components: `app/(dashboard)/[feature]/page.tsx`
- Tests: `tests/[feature].test.ts`

**New Component/Module:**
- Implementation: `components/[category]/[component-name].tsx`
- Shared utilities: `lib/utils.ts` or `lib/[feature].ts`
- Types: `lib/types/[feature].ts`

**Database Changes:**
- Schema changes: `prisma/schema.prisma`
- Migrations: Generated via `prisma migrate dev`
- Client types: Generated in `lib/generated/prisma/`

## Special Directories

**.next/:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**lib/generated/:**
- Purpose: Auto-generated Prisma client
- Generated: Yes
- Committed: Sometimes (depends on team preference)

**prisma/migrations/:**
- Purpose: Database migration history
- Generated: Yes (by Prisma)
- Committed: Yes

---

*Structure analysis: 2026-02-03*