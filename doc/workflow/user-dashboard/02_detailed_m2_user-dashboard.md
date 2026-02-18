# Detailed Phase - Milestone 2: Dashboard Layout & Hero Card
**Parent:** 02_task_plan_user-dashboard.md
**Files Involved:** `components/`, `app/`, `lib/`

### Task 2.1: Implement Bento Grid Layout (F12)
**Effort:** M
1. [ ] Create `BentoGrid.tsx` component with `grid-cols-4` on desktop
2. [ ] Implement responsive breakpoint at `md` - switch to `grid-cols-1` vertical stack
3. [ ] Add KPI cards 2x2 sub-grid layout for mobile
4. [ ] Ensure proper spacing and gap following Redify system

### Task 2.2: Build Hero Card - Next Leave (F01)
**Effort:** L
1. [ ] Create `HeroCard.tsx` component (`col-span-2 row-span-2`)
2. [ ] Implement query logic: dateEnd >= TODAY, status APPROVED/NEW, order by dateStart ASC
3. [ ] Add title "Next Leave" in Neutral-400
4. [ ] Display dates in extended format (e.g., "May 15 - 18") with semibold weight
5. [ ] Add status badge (colored pill based on status)
6. [ ] Implement approval progress bar with Neon Lime color
7. [ ] Add "Step X of Y" text with approver name (e.g., "Step 2 of 3: HR Approval")

### Task 2.3: Empty State Handling (F01)
**Effort:** S
1. [ ] Create minimal placeholder for Hero Card when no future requests exist
2. [ ] Ensure empty state follows Redify design system

## 🔄 Next Steps
- Complete all tasks. Update Master Plan for each completion.
- Archive this checklist when Task 2.1-2.3 are finished.
- Proceed to Milestone 3: KPI Satellite Cards

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-18 | 1.0 | Milestone breakdown |
