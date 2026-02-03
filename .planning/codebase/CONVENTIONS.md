# Coding Conventions

**Analysis Date:** 2026-02-03

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `MainNavigation.tsx`, `leave-request-form.tsx`)
- Utilities/libraries: kebab-case (e.g., `leave-validation-service.ts`, `api-helper.ts`)
- Hooks: camelCase with `use-` prefix (e.g., `use-mobile.ts`, `use-notification-badge.ts`)
- Pages: lowercase with hyphens (e.g., `page.tsx`, `company-form.tsx`)
- Config files: kebab-case with extensions (e.g., `eslint.config.mjs`, `next.config.ts`)

**Functions:**
- camelCase for regular functions (e.g., `calculateLeaveDays`, `getAllowanceBreakdown`)
- PascalCase for React components (e.g., `Button`, `MainNavigation`)
- Static methods use PascalCase class names (e.g., `LeaveValidationService.validateRequest`)

**Variables:**
- camelCase for all variables (e.g., `dateStart`, `daysRequested`, `adminStatus`)
- Constants: UPPER_SNAKE_CASE (e.g., `MOBILE_BREAKPOINT`)

**Types:**
- Interfaces: PascalCase with descriptive names (e.g., `ValidationResult`, `AllowanceBreakdown`)
- Enums: PascalCase (e.g., `DayPart`, `LeaveStatus`)
- Type aliases: PascalCase (e.g., `ClassValue`)

## Code Style

**Formatting:**
- Tool: ESLint with Next.js configuration (`eslint.config.mjs`)
- No Prettier configuration detected
- Indentation: 2 spaces (observed in code)
- Semi-colons: Used consistently
- Quotes: Double quotes for strings

**Linting:**
- ESLint with Next.js typescript and core-web-vitals configs
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

## Import Organization

**Order:**
1. Node.js/built-in imports (e.g., `import * as React from "react"`)
2. Third-party package imports (e.g., `import { cva } from "class-variance-authority"`)
3. Local/absolute imports using `@/` alias (e.g., `import { cn } from "@/lib/utils"`)

**Path Aliases:**
- `@/*` mapped to root directory (configured in `tsconfig.json`)
- Used consistently: `@/lib/utils`, `@/components/ui/button`, `@/lib/prisma`

## Error Handling

**Patterns:**
- Service methods return `ValidationResult` objects with `isValid`, `errors`, `warnings`
- Database errors thrown as exceptions with descriptive messages
- Validation errors collected in arrays and returned together
- Async functions use try-catch with proper error propagation
- Database operations use `prisma.$disconnect()` in finally blocks

**Example from `LeaveValidationService.validateRequest`:**
```typescript
return {
    isValid: errors.length === 0,
    errors,
    warnings,
    daysRequested
};
```

## Logging

**Framework:** Console logging only (no structured logging framework detected)

**Patterns:**
- Development debugging: `console.log()`, `console.error()`
- Test runners: `console.log()` for test output
- Database checks: `console.log()` with emoji indicators for status
- No production logging configuration detected

## Comments

**When to Comment:**
- Complex business logic explanations
- TODO/FIXME markers for future work
- Algorithm explanations in validation services
- Database schema relationship notes

**JSDoc/TSDoc:**
- Used sparingly in service classes
- Interface definitions documented with inline comments
- Method parameters documented with comments rather than formal JSDoc

## Function Design

**Size:** Functions typically under 30 lines, with complex validation methods reaching 50-80 lines

**Parameters:**
- Primitive types preferred for service methods
- Objects used for complex configuration (React component props)
- Optional parameters handled explicitly

**Return Values:**
- Service methods return structured objects (e.g., `ValidationResult`)
- Database queries return Prisma models or counts
- React components return JSX elements

## Module Design

**Exports:**
- Default exports for React components
- Named exports for utility functions and services
- Class exports for service classes with static methods

**Barrel Files:**
- Limited use of barrel files
- UI components exported individually from their own files
- No centralized index files detected for component grouping

---

*Convention analysis: 2026-02-03*