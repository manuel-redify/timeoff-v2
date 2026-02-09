# Checklist - Task 1.1: Configure Inter font and CSS tokens
**Parent:** `02_detailed_m1_navigation-bar-restyling.md`

### Steps
- [x] Step 1: Import `Inter` from `next/font/google` in `app/layout.tsx`.
- [x] Step 2: Configure `Inter` with `variable: "--font-inter"` and subset `latin`.
- [x] Step 3: Replace `geistSans` usage with `inter` in `RootLayout`.
- [x] Step 4: Add `--color-primary: #e2f337;` and `--color-primary-dark: #d4e62e;` to `@theme` in `app/globals.css`.
- [x] Step 5: Add `--color-canvas: #ffffff;` and ensure neutral palette (100, 200, 400, 900) maps to CSS variables.
- [x] Step 6: Verify font loading and CSS variable availability in the browser.

### Done When
- [x] `Inter` font is applied to the application via `--font-inter`.
- [x] Neon Lime tokens are available as Tailwind colors (`primary` and `primary-hover`).
- [x] Border and border-radius utilities are confirmed to be operational.

## 🔄 Next Steps (Agent Instructions)
1. Complete steps autonomously and update live.
2. Upon completion: Update Parent files, Commit, Archive this file, and ask for the next task.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-09 | 1.0 | Checklist creation |
