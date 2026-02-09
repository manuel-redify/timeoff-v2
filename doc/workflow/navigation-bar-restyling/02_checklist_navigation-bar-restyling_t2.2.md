# Checklist - Task 2.2: Implement responsive "New Leave" button
**Parent:** `02_detailed_m2_navigation-bar-restyling.md`

### Steps
- [ ] Step 1: Identify the "New Request" button in `components/ui/MainNavigation.tsx`.
- [ ] Step 2: Implement responsive rendering logic:
    - **Mobile (<768px):** Circular button (`rounded-full`, `w-10 h-10` or similar) containing only a `Plus` icon.
    - **Desktop (>=768px):** Pill-shaped button (`rounded-full`, `px-6 py-2`) containing "New Leave" text (and optionally the icon).
- [ ] Step 3: Apply Redify functional styling:
    - Background: `#e2f337` (Primary Neon Lime).
    - Text/Icon: `Black`.
    - Hover: `bg-[#d4e62e]` (Saturated neon lime).
    - Active: `scale-95` or `scale-98` (per PRD §3).
- [ ] Step 4: Ensure proper `150ms ease-in-out` transitions for all states.
- [ ] Step 5: Verify the button layout remains balanced next to the logo on mobile.

### Done When
- [ ] Button is a pill with text on desktop.
- [ ] Button is a circle with "+" on mobile.
- [ ] Colors and transitions match the design system specification.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
