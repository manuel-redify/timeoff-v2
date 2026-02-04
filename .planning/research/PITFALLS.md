# Domain Pitfalls
**Domain:** Project Management Settings Module
**Researched:** 2026-02-04

## Critical Pitfalls
### Pitfall 1: Inconsistent Settings State Across UI and DB
What goes wrong: Changes appear saved in UI but not persisted or vice versa; stale UI data.
Why it happens: Missing optimistic update strategy, caching issues, or partial migrations.
Prevention: Use a single source of truth, ensure write-through consistency, invalidate caches after writes, and implement end-to-end tests.
Detection: Mismatch checks between UI state and DB after save; audit checks fail.

### Pitfall 2: Migration Friction for Brownfield Data
What goes wrong: Legacy settings fields conflict with new schema; migrations fail or corrupt data.
Prevention: Create migration-safe mapping; provide rollback paths; seed with defaults.
Detection: Migration tests fail or data gaps observed after upgrade.

### Pitfall 3: Inadequate RBAC for Settings
What goes wrong: Settings admin exposed to broad groups; risk of misconfiguration.
Mitigation: Design RBAC around sensitive action categories; include audit checks

### Pitfall 4: Lack of Auditability
What goes wrong: No traceability for who changed what; governance gaps.
Mitigation: Implement audit log and versioned settings

### Pitfall 5: Performance & Load
What goes wrong: Sluggish admin UI at scale; large configuration trees.
Mitigation: Lazy load sections; pagination; caching for read paths

### Pitfall 6: Security Misconfigurations
What goes wrong: Secrets exposure; misconfigured access tokens.
Mitigation: Ensure secure storage; least privilege; restrict admin endpoints

## Phase-Specific Warnings
| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| UI scaffolding | Incomplete forms and validation | Use React Hook Form + Zod; incremental tests |
| Policy engine MVP | Overly complex workflows | Start with simple linear approvals; plan for expansion |
| Data migration | Breaking changes | Write migration scripts; seed data; test thoroughly |

## Sources
- Internal design notes
- Industry best practices for admin UI and RBAC
- Admin UI pitfalls from community discussions
