# Detailed Phase - Milestone 3 - Calendar Views
**Version:** v1
**Date:** 2026-01-24
**Source:** 01_prd_analysis_v1.md

## 📝 Detailed Phase - Milestone 3

### Task [3.1]: Integrate view filtering with URL state
1. [ ] Update `useCalendarFilters` hook (or equivalent) to sync with `useSearchParams`.
2. [ ] Ensure page refresh or "Back" button preserves filter state.
3. [ ] Implement deep linking for specific views (e.g., specific month/year).
**Effort:** M | **Skills:** frontend.md

### Task [3.2]: Add iCal feed management UI
1. [ ] Add "Calendar Integration" section to User Profile settings.
2. [ ] Implement "Generate/Regenerate Token" functionality.
3. [ ] Display the iCal Feed URL for copy-pasting.
4. [ ] (Optional) Add company-wide iCal feed management for admins.
**Effort:** M | **Skills:** frontend.md, backend.md

### Task [3.3]: Mobile-responsive adaptations
1. [ ] Create a "List" or "Dot" fallback for the Month grid on small screens.
2. [ ] Optimize Wall Chart for horizontal scrolling or card-based team view.
3. [ ] Ensure filter sidebar/modal works well on mobile.
**Effort:** L | **Skills:** frontend.md

### Task [3.4]: Final testing and verification
1. [ ] Verify permissions (different roles, settings).
2. [ ] Test performance with mock data (500+ users).
3. [ ] Cross-browser testing for iCal feed compatibility (Google Cal, Outlook, Apple).
**Effort:** M | **Skills:** debug.md
