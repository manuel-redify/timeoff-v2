# Dashboard Page - Web Performance Optimization Audit

**Date:** February 23, 2026  
**Auditor:** OpenCode AI Agent  
**Scope:** Dashboard Page (app/(dashboard)/page.tsx, Approvals Dashboard)

---

## Executive Summary

This report documents the findings from a comprehensive web performance audit of the dashboard page using the web-performance-optimization skill. The audit identified several performance bottlenecks and provides prioritized recommendations for optimization.

| Status | Issues Found |
|--------|--------------|
| 🔴 Critical | 1 |
| 🟠 High | 3 |
| 🟡 Medium | 4 |
| ✅ Positive | 6 |

---

## 1. Current State Analysis

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.1 |
| React Version | 19.2.3 |
| UI Components | shadcn/ui (Radix UI) |
| Styling | Tailwind CSS 4 |
| Database ORM | Prisma |
| Authentication | NextAuth.js 5.0.0-beta.30 |

### Dashboard Components Analyzed

| File | Description |
|------|-------------|
| `app/(dashboard)/page.tsx` | Main dashboard page (Server Component) |
| `app/(dashboard)/approvals/approvals-dashboard.tsx` | Approvals dashboard (Client Component) |

---

## 2. Critical Issues

### 2.1 Database Pagination Missing — HIGH IMPACT

**Location:** `app/(dashboard)/page.tsx:51-76`

**Current Implementation:**
```typescript
// Fetches ALL requests, then filters in JS memory
const allRequests = await prisma.leaveRequest.findMany({
  where: { userId: user.id, deletedAt: null },
  include: { leaveType: true },
  orderBy: { createdAt: 'desc' }
});

// In-memory filtering
const requests = allRequests.filter((req) => {
  const matchesYear = !selectedYear || getYear(new Date(req.dateStart)) === selectedYear;
  const matchesStatus = !selectedStatus || req.status === selectedStatus;
  return matchesYear && matchesStatus;
});
```

**Impact:**
- Fetches all records even when only 10 are displayed
- Increased TTFB (Time to First Byte)
- Large payload transferred to server
- Memory pressure on server

**Recommended Fix:**
```typescript
// Move filtering to database level
const whereClause: Prisma.LeaveRequestWhereInput = {
  userId: user.id,
  deletedAt: null,
};

if (selectedYear) {
  whereClause.dateStart = {
    gte: new Date(selectedYear, 0, 1),
    lt: new Date(selectedYear + 1, 0, 1),
  };
}

if (selectedStatus) {
  whereClause.status = selectedStatus;
}

const [allRequests, totalItems] = await Promise.all([
  prisma.leaveRequest.findMany({
    where: whereClause,
    include: { leaveType: true },
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  }),
  prisma.leaveRequest.count({ where: whereClause }),
]);
```

---

## 3. High Priority Issues

### 3.1 No Virtualization in Approvals Dashboard

**Location:** `app/(dashboard)/approvals/approvals-dashboard.tsx:299-392`

**Current Implementation:**
```typescript
// Renders ALL items at once
approvals.map((approval) => (
  <Card key={approval.id} ...>
))
```

**Impact:**
- Slow initial render for 100+ approvals
- High memory usage
- Scroll jank

**Recommended Fix:**
```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: approvals.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200,
  overscan: 5,
});

return (
  <div ref={parentRef} className="h-[600px] overflow-auto">
    <div style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualRow) => (
        <div
          key={virtualRow.key}
          style={{
            position: 'absolute',
            top: virtualRow.start,
            height: virtualRow.size,
          }}
        >
          <Card>{/* Approval card */}</Card>
        </div>
      ))}
    </div>
  </div>
);
```

### 3.2 Empty next.config.ts

**Location:** `next.config.ts:3-5`

**Current State:**
```typescript
const nextConfig: NextConfig = {
  /* config options here */
};
```

**Missing Optimizations:**
- No bundle analyzer
- No compression config
- No image optimization settings
- No headers caching

**Recommended Fix:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', '@radix-ui/react-*'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/:path*.(js|css|woff|woff2|ttf)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 3.3 Sequential Database Calls

**Location:** `app/(dashboard)/page.tsx:43-47`

**Current Implementation:**
```typescript
const breakdown = await AllowanceService.getAllowanceBreakdown(user.id, currentYear);
const pendingRequests = await LeaveRequestService.getPendingRequests(user.id);
const upcomingCount = await LeaveRequestService.getUpcomingCount(user.id);
const leavesTakenYTD = await LeaveRequestService.getLeavesTakenYTD(user.id);
const nextLeave = await LeaveRequestService.getNextLeave(user.id);
```

**Impact:** 5 sequential database calls that could run in parallel.

**Recommended Fix:**
```typescript
const [breakdown, pendingRequests, upcomingCount, leavesTakenYTD, nextLeave] = 
  await Promise.all([
    AllowanceService.getAllowanceBreakdown(user.id, currentYear),
    LeaveRequestService.getPendingRequests(user.id),
    LeaveRequestService.getUpcomingCount(user.id),
    LeaveRequestService.getLeavesTakenYTD(user.id),
    LeaveRequestService.getNextLeave(user.id),
  ]);
```

---

## 4. Medium Priority Issues

| Issue | Location | Impact |
|-------|----------|--------|
| No Suspense boundaries for streaming | `app/(dashboard)/page.tsx` | Slower Time to Interactive |
| No caching headers on API routes | API routes | Repeated unnecessary DB calls |
| Large client component | `approvals-dashboard.tsx` (433 lines) | Bundle size impact |
| Missing `loading.tsx` | `app/(dashboard)/approvals/` | Blocking UI |

---

## 5. Positive Patterns Observed

- ✅ Server Components reduce client-side JavaScript
- ✅ Tailwind CSS 4 (atomic CSS - excellent for performance)
- ✅ Uses `date-fns` (lightweight vs moment.js)
- ✅ Has loading.tsx for main dashboard
- ✅ Uses React 19 with automatic optimization
- ✅ Uses skeleton loading states

---

## 6. Optimization Priority Plan

### Phase 1: Critical Fixes (High Impact)
- [ ] Implement DB-level pagination (Issue 2.1)
- [ ] Add `Promise.all()` for parallel queries (Issue 3.3)
- [ ] Add virtualization to approvals (Issue 3.1)

### Phase 2: Configuration Improvements
- [ ] Configure next.config.ts (Issue 3.2)
- [ ] Add Suspense boundaries with streaming for dashboard cards

### Phase 3: Advanced Optimizations
- [ ] Implement React `cache()` for repeated data fetching
- [ ] Consider React Query / SWR for client-side data caching

---

## 7. Expected Improvements

| Metric | Current (Est.) | Target |
|--------|----------------|--------|
| **TTFB** | 400-600ms | <200ms |
| **LCP** | 2.5-3.5s | <1.5s |
| **CLS** | 0.1-0.2 | <0.1 |
| **Bundle Size** | Unknown | -30% |

---

## 8. Performance Checklist

### Images
- [ ] Convert to modern formats (WebP, AVIF)
- [ ] Implement responsive images
- [ ] Add lazy loading
- [ ] Specify dimensions (width/height)

### JavaScript
- [ ] Bundle size < 200KB (gzipped)
- [ ] Implement code splitting
- [ ] Lazy load non-critical code
- [ ] Remove unused dependencies

### Database
- [ ] Implement DB-level pagination
- [ ] Use `Promise.all()` for parallel queries
- [ ] Add database indexes for common queries

### Caching
- [ ] Set cache headers for static assets
- [ ] Cache API responses where appropriate
- [ ] Version static assets

### Core Web Vitals Targets
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTFB < 600ms

---

## 9. Related Files

- `app/(dashboard)/page.tsx` - Main dashboard page
- `app/(dashboard)/approvals/approvals-dashboard.tsx` - Approvals dashboard
- `next.config.ts` - Next.js configuration
- `package.json` - Project dependencies

---

*Report generated using @web-performance-optimization skill*
