# External Integrations

**Analysis Date:** 2026-02-03

## APIs & External Services

**Email Service:**
- SMTP2GO - Transactional email delivery
  - SDK/Client: smtp2go-nodejs 0.3.6
  - Auth: SMTP2GO_API_KEY environment variable
  - Implementation: `lib/smtp2go.ts`

**Authentication:**
- Google OAuth - Google Workspace authentication
  - SDK/Client: NextAuth.js Google provider
  - Auth: AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET environment variables
  - Implementation: `auth.ts` (enabled in production)

**Tunnel Service:**
- Serveo - Development tunneling
  - Auth: SERVEO_SUBDOMAIN environment variable
  - Implementation: `scripts/serveo-tunnel.sh`

## Data Storage

**Databases:**
- PostgreSQL - Primary database
  - Connection: DATABASE_URL environment variable
  - Client: Prisma ORM with @prisma/adapter-pg
  - SSL mode: require (as per .env.example)

**File Storage:**
- Local filesystem only - No cloud storage detected

**Caching:**
- None detected beyond Next.js built-in caching

## Authentication & Identity

**Auth Provider:**
- NextAuth.js v5 (beta) - Authentication framework
  - Implementation: Custom auth configuration in `auth.ts`
  - Providers: Google OAuth (production), Credentials (development)
  - Adapter: @auth/prisma-adapter for database sessions

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- Console-based logging throughout application
- Email audit logging in database (`EmailAudit` model)

## CI/CD & Deployment

**Hosting:**
- Not specified (Next.js app can deploy anywhere)

**CI Pipeline:**
- None detected in repository

## Environment Configuration

**Required env vars:**
- DATABASE_URL - PostgreSQL connection string
- AUTH_SECRET - NextAuth.js secret
- AUTH_GOOGLE_ID - Google OAuth client ID
- AUTH_GOOGLE_SECRET - Google OAuth client secret
- SMTP2GO_API_KEY - SMTP2GO email service API key
- SERVEO_SUBDOMAIN - Serveo tunnel subdomain
- DEV_DEFAULT_PASSWORD - Development default password
- ENABLE_OAUTH_IN_DEV - Toggle OAuth in development

**Secrets location:**
- Environment variables (.env, .env.local files)

## Webhooks & Callbacks

**Incoming:**
- NextAuth.js auth callbacks - `/api/auth/[...nextauth]/route.ts`

**Outgoing:**
- SMTP2GO email API calls - POST to `https://api.smtp2go.com/v3/email/send`
- Google OAuth flow redirects

## Integration-Specific Details

**Supabase Integration:**
- @supabase/supabase-js 2.90.0 and @supabase/ssr 0.8.0 installed
- Usage not detected in main codebase but may be for specific features

**Calendar Integration:**
- iCal feed generation for user calendars
- Route: `/api/calendar/ical/[token]/route.ts`
- Uses user-specific ical feed tokens

**Email Templates:**
- Custom HTML email templates in `lib/smtp2go.ts`
- Production: Google login instructions
- Development: Temporary password delivery

---

*Integration audit: 2026-02-03*