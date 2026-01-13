# PRD 16: Deployment & DevOps

**Document Version:** 1.0  
**Date:** January 13, 2026  
**Status:** Draft  
**Author:** Senior Product Manager
**Related PRDs:** [PRD 00 (Overview)], [PRD 12 (Database Schema)], [PRD 13 (API Specifications)]

---

## Executive Summary

This document defines the deployment architecture, infrastructure management, and DevOps practices for TimeOff Management Application v2. The goal is to establish a robust, automated pipeline from development to production using Vercel, Neon, and GitHub Actions, ensuring high availability, security, and performance.

---

## 1. Cloud Infrastructure & Hosting

### 1.1 Frontend & API (Vercel)
- **Platform:** Vercel (Optimized for Next.js 14+).
- **Region:** `fra1` (Frankfurt, Germany) to minimize latency for European users (default for the legacy app's context).
- **Framework:** Next.js App Router (Serverless Functions).

### 1.2 Database (Neon PostgreSQL)
- **Provider:** Neon.
- **Type:** Serverless PostgreSQL.
- **Connection Pooling:** Use Prisma Accelerate or Neon's built-in connection pooling for serverless environments.
- **Backups:** Daily automated backups with 7-day retention.

### 1.3 Authentication (Clerk)
- **Deployment:** Managed by Clerk.
- **Environments:** Separate Clerk instances for Development and Production.

### 1.4 Email Service (Resend)
- **Provider:** Resend.
- **Configuration:** Verified domain with DKIM/SPF records.

---

## 2. Environment Management

The application operates across three distinct environments:

| Environment | Branch | Database | Auth (Clerk) | Purpose |
|-------------|--------|----------|--------------|---------|
| **Development**| `dev` | Neon Dev Branch | Clerk Dev Instance | Local and feature development |
| **Staging** | `staging`| Neon Staging Branch| Clerk Dev Instance | QA and pre-production testing |
| **Production** | `main` | Neon Prod Branch | Clerk Production | Live customer traffic |

### 2.1 Environment Variables
All secrets must be managed via Vercel's environment variables dashboard. **Never commit `.env` files.**

**Required Variables:**
- `DATABASE_URL`: Connection string for Prisma.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key.
- `CLERK_SECRET_KEY`: Clerk private key.
- `CLERK_WEBHOOK_SECRET`: For validating user sync webhooks.
- `RESEND_API_KEY`: For email delivery.
- `BASE_URL`: Public URL of the application.

---

## 3. CI/CD Pipeline

### 3.1 Version Control
- **Platform:** GitHub.
- **Workflow:** Trunk-based development with short-lived feature branches.
- **Protection:** `main` and `staging` branches require PR approval and passing checks.

### 3.2 Automated Workflow (GitHub Actions)
1. **Lint & Type Check:** Triggered on every Push/PR.
2. **Unit & Integration Tests:** Triggered on every PR.
3. **Database Migration:** Prisma migration check.
4. **Vercel Preview:** Automatic deployment to preview URLs for every PR.

### 3.3 Deployment Process
1. **Staging:** Automatic deploy to `staging` when code is merged.
2. **Production:** Automatic deploy to `main` when code is merged.
3. **Post-Deployment:** Database migrations run automatically via `prisma migrate deploy` during the build phase.

---

## 4. Monitoring & Observability

### 4.1 Error Tracking
- **Tool:** Sentry or Vercel Error Monitoring.
- **Scope:** Capture all 500-range API errors and frontend crashes.

### 4.2 Logging
- **Tool:** Vercel Logs / Logflare.
- **Requirement:** Retain logs for 14 days for debugging.

### 4.3 Performance Monitoring
- **Tool:** Vercel Analytics (Speed Insights).
- **Target:** Core Web Vitals in the "Good" range.

---

## 5. Scalability & Disaster Recovery

### 5.1 Auto-Scaling
- **Compute:** Vercel automatically scales serverless functions based on request volume.
- **Database:** Neon autoscales compute resources based on load.

### 5.2 Disaster Recovery
- **Database:** Recovery point objective (RPO) of 24 hours via automated backups.
- **Code:** Git history serves as the primary recovery mechanism for the application layer.
- **Infrastructure:** Configuration documented in this PRD allows for full environment rebuild within 4 hours.

---

## 6. Implementation Checklist

- [ ] Initialize Vercel project and link to GitHub.
- [ ] Configure Neon PostgreSQL project with branching.
- [ ] Setup Clerk Production instance.
- [ ] Configure Resend for domain.
- [ ] Implement GitHub Actions for CI.
- [ ] Set environment variables across all Vercel environments.
- [ ] Verify `prisma migrate deploy` in build command.

---

*End of PRD 16 - Deployment & DevOps*
