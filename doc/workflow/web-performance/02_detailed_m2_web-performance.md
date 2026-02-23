# Detailed Phase - Milestone 2: Client-Side Rendering Optimizations

**Parent:** 02_task_plan_web-performance.md
**Files Involved:** 
- `app/(dashboard)/approvals/approvals-dashboard.tsx`
- `app/(dashboard)/page.tsx`
- `package.json`

### Task 2.1: Add virtualization to Approvals Dashboard

1. [ ] Install `@tanstack/react-virtual` package
2. [ ] Refactor `approvals.map()` to use virtualized list with `useVirtualizer`
3. [ ] Add fixed height container with overflow for virtual scroll
4. [ ] Configure overscan for smooth scrolling

**Effort:** M

### Task 2.2: Add Suspense boundaries with streaming for dashboard cards

1. [ ] Wrap individual dashboard cards in `Suspense` components
2. [ ] Add skeleton fallback components for each card type
3. [ ] Test streaming behavior with slow network throttling

**Effort:** S

---

## 🔄 Next Steps
- Complete all tasks in this milestone.
- Update Master Plan for each completion.
- Create Detailed Phase for Milestone 3 after completing Milestone 2.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-23 | 1.0 | Milestone breakdown |
