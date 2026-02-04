# Technology Stack

**Project:** TimeOff - Project Management Settings Module
**Researched:** 2026-02-04

## Overview
- Brownfield enhancement to the existing TimeOff system.
- UI component library focus: project management settings dialogs, forms, and admin UI.
- Goal: choose a cohesive stack that minimizes risk while enabling robust admin UX.

## Recommended Stack

### Frontend / UI
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 16.x | Frontend framework with app router | Mature, aligns with existing TimeOff frontend, strong DX for admin UI |
| React | 19 | UI library | Modern DX, concurrent features; strong ecosystem |
| TypeScript | 5.x | Type safety | Reduces runtime errors; improves maintainability |
| Tailwind CSS | 3.x | Styling | Works with design system; fast iteration |
| shadcn/ui | latest | Component library for Tailwind | Built-in admin-ready components and design system coherence |
| Radix UI | latest | Accessible primitives | Improves accessibility for complex widgets |
| TanStack Table | latest | Data grid / tables | Rich, flexible table UI for settings lists |
| React Hook Form | latest | Form handling | Efficient forms with schema validation |
| Zod | latest | Schema validation | Lightweight runtime validation |
| Zustand | latest | Local/UI state | Lightweight, fast, easy to reason about ahead of global state needs |

### Backend / Data
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Prisma ORM | 5.x | Data access layer | Strong TS typing with DB schema; good DX for migrations |
| PostgreSQL | 15+ | Primary database | Mature, reliable, scalable for multi-tenant data |
| tRPC | latest | Type-safe API layer | Reduces boilerplate; end-to-end types between frontend and backend |
| NextAuth.js | latest | Authentication/Authorization | Flexible, well-supported for Next.js apps |

### Infrastructure / DevEx
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind + PostCSS | latest | Styling pipeline | Standard with shadcn/ui; consistent look & feel |
| Docker / Docker Compose | latest | Local dev / dev env isolation | Replicates prod env; easy on-boarding |
| PostgreSQL tooling | latest | DB tooling | Admin tasks; migrations; seeds |

### Alternatives Considered
- REST + Next.js API routes as fallback for smaller routes
- Prisma alternatives (e.g., TypeORM) were considered but not preferred due to DX parity with Prisma
- Admin UI libraries (Material UI, Chakra) considered but deprioritized to maintain design coherence with TimeOff

## Installation (reference)
```
bash
# Core frontend
npm install next@16 react@19 react-dom@19 typescript@5

# UI / styling
npm install tailwindcss@latest postcss@latest autoprefixer@latest
# Follow shadcn/ui setup guide for integration

# Backend / ORM
npm install prisma@latest @prisma/client@latest

# API layer and utilities
npm install @trpc/server @trpc/client @trpc/react
npm install next-auth
```

## Sources
- Next.js official docs (v16)
- shadcn/ui docs
- Prisma ORM docs
- PostgreSQL docs
- Radix UI docs
- tRPC docs
- NextAuth docs
