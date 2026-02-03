# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- TypeScript 5 - All source code in `.ts`, `.tsx` files

**Secondary:**
- Not detected

## Runtime

**Environment:**
- Node.js (required for Next.js)

**Package Manager:**
- npm (package.json present)
- Lockfile: package-lock.json (implied by package.json)

## Frameworks

**Core:**
- Next.js 16.1.1 - React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM renderer

**Authentication:**
- NextAuth.js 5.0.0-beta.30 - Authentication framework

**Database:**
- Prisma 7.2.0 - ORM and database toolkit

**UI Components:**
- Radix UI components - Headless UI primitives
- shadcn 3.6.3 - UI component library
- Tailwind CSS 4 - CSS framework

**Form Handling:**
- React Hook Form 7.71.1 - Form management
- Zod 4.3.5 - Schema validation

**Testing:**
- Not detected in main dependencies

**Build/Dev:**
- ESLint 9 - Linting
- TypeScript 5 - Type checking

## Key Dependencies

**Critical:**
- @prisma/client 7.2.0 - Database ORM client
- @prisma/adapter-pg 7.2.0 - PostgreSQL adapter
- pg 8.17.1 - PostgreSQL client
- next-auth 5.0.0-beta.30 - Authentication
- bcryptjs 3.0.3 - Password hashing

**Infrastructure:**
- @supabase/supabase-js 2.90.0 - Supabase client
- @supabase/ssr 0.8.0 - Server-side Supabase
- smtp2go-nodejs 0.3.6 - Email service
- date-fns 4.1.0 - Date utilities

## Configuration

**Environment:**
- Environment variables in `.env`, `.env.local`
- Key configs: DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID/SECRET, SMTP2GO_API_KEY

**Build:**
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration (minimal)
- `prisma.config.ts` - Prisma configuration
- `postcss.config.mjs` - PostCSS configuration
- `eslint.config.mjs` - ESLint configuration

## Platform Requirements

**Development:**
- Node.js (version compatible with Next.js 16)
- PostgreSQL database
- npm package manager

**Production:**
- PostgreSQL database with SSL
- Google OAuth configuration (for production auth)
- SMTP2GO API key for email functionality

---

*Stack analysis: 2026-02-03*