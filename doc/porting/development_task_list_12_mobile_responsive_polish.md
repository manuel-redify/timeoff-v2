# Phase 12: Mobile & Responsive Polish - Task List

## Overview
This phase focuses on refining the user experience across all device sizes. It implements a mobile-first layout strategy, touch-optimized interactions, and Progressive Web App (PWA) capabilities. The goal is to ensure that employees and managers can efficiently manage leave regardless of their device or location.

## Prerequisites
- [ ] Phases 1 through 11 completed.
- [ ] Responsive design principles established in Phase 1 (Foundation).
- [ ] All primary features (Requests, Approvals, Calendar, Reports) implemented in their base responsive states.
- [ ] Read and understood [PRD 11: Mobile & Responsive Experience](file:///prd/porting_prd/prd_11_mobile_and_responsive_experience.md).

## Detailed Task Breakdown

### 1. Database & Backend
- [ ] **PWA Manifest & Service Worker**: Configure `manifest.json` and service worker logic for offline-ready features.
  - **Done looks like**: App can be installed to home screen (A2HS) and basic offline mode is functional.
- [ ] **Mobile-Specific API Optimizations** (Optional): Ensure common mobile entry points (dashboard summary) are highly performant.
  - **Done looks like**: Key mobile views load in ≤ 200ms on 4G networks.

### 2. UI & Frontend
- [ ] **Implementation of Mobile-First Breakpoints**: Audit all pages and apply `sm:`, `md:`, `lg:` Tailwind modifiers where missing.
  - **Done looks like**: Every page responds fluidly without horizontal scroll across all standard breakpoints.
- [ ] **Mobile Navigation Pattern**: Implement the Bottom Navigation bar for mobile viewports and Hamburger menu for admin/settings.
  - **Done looks like**: Navigation is intuitive and ergonomic on thumb-driven interfaces.
- [ ] **Touch Target Optimization**: Ensure all interactive elements meet the minimum 44x44px touch target requirement.
  - **Done looks like**: Buttons and links are easy to hit without accidental clicks.
- [ ] **Form Interaction Polish**: Optimize form fields for mobile context (native date pickers, appropriate keyboards).
  - **Done looks like**: Submitting a leave request on mobile is smooth and uses native device capabilities.
- [ ] **Mobile Calendar Refresh**: Refine the Calendar and Wall Chart views for small screens.
  - **Done looks like**: Calendar remains readable on mobile (e.g., using dots/counts instead of full text labels).

### 3. Integration & Glue Code
- [ ] **PWA Integration**: Register service workers and manifest in the Next.js App Router root layout.
  - **Done looks like**: PWA features are correctly detected by Lighthouse and mobile browsers.
- [ ] **Quick Action Integration**: Add a global Floating Action Button (FAB) or prominent shortcut for "Request Leave".
  - **Done looks like**: Users can start a leave request from any primary page with one tap.
- [ ] **Performance & Asset Optimization**: Audit fonts, icons, and final JS bundles for mobile efficiency.
  - **Done looks like**: App passes Core Web Vitals targets for mobile devices.

## Acceptance Criteria
- [ ] Core workflows (Request Leave, Approve/Reject) take ≤ 30 seconds on average on mobile devices.
- [ ] Layout switches correctly at all target breakpoints without visual artifacts or broken elements.
- [ ] App is installable as a PWA and shows a splash screen on both iOS and Android.
- [ ] Zero horizontal scrolling on all resolutions down to 320px (iPhone SE).
- [ ] All interactive components are accessible and touch-friendly (44x44px targets).

## Testing & Validation Checklist
- [ ] Manual verification on real iOS and Android devices (at least one of each).
- [ ] Responsive design audit using Browser DevTools for all major page types.
- [ ] Lighthouse report check for "PWA" and "Best Practices" on mobile profile.
- [ ] Accessibility check for touch targets and contrast in mobile contexts.
- [ ] Manual verification of orientation change (Portrait to Landscape) handling on tablets.
