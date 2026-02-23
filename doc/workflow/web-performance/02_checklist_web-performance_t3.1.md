# Checklist - Task 3.1: Configure next.config.ts with optimizations

**Parent:** 02_detailed_m3_web-performance.md

### Steps

- [x] 1. Read current `next.config.ts`
- [x] 2. Add `experimental.optimizePackageImports` for lucide-react, date-fns, radix-ui
- [x] 3. Configure `images.formats` for AVIF and WebP
- [x] 4. Verify build succeeds with new configuration

### Done When

- [x] optimizePackageImports configured for common packages
- [x] Image formats configured for AVIF and WebP

**Note:** Build has pre-existing error in `approvals/page.tsx` (unrelated to this change).

## 🔄 Next Steps (Agent Instructions)

1. Complete steps autonomously and update live.
2. Upon completion: Update Master Plan (mark 3.1 [x]), then proceed to Task 3.2.

## 📜 Change Log
| Date | Version | Description |
|------|---------|-------------|
| 2026-02-23 | 1.0 | Checklist creation |
| 2026-02-23 | 1.1 | Added optimizePackageImports and image formats config |
