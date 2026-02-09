# Checklist - Task 2.1: Update Logo and basic nav links
**Parent:** `02_detailed_m2_navigation-bar-restyling.md`

### Steps
- [ ] Step 1: Replace "TimeOff" text logo in `MainNavigation.tsx` with an `Image` component pointing to `/assets/logo.svg`.
- [ ] Step 2: Implement Redify link styling in `MainNavigation.tsx`:
    - Update `isActive` helper to return classes for `bg-[#f2f3f5] text-neutral-900 font-bold`.
    - Update `ProtectedLink` base classes to include `text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 rounded-full px-3 py-1.5 transition-all duration-150 ease-in-out`.
- [ ] Step 3: Remove default icons (`Home`, `User`, etc.) from main links if they conflict with the "Redify" look (unless explicitly required to keep icons next to text).
- [ ] Step 4: Verify the logo scaling and link hover/active states across different page routes.

### Done When
- [ ] Visual logo matches `assets/logo.svg`.
- [ ] Navigation links follow the neutral-400/neutral-900/f2f3f5 color cycle.
- [ ] Active state is clearly visible via bold text and light grey background.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
