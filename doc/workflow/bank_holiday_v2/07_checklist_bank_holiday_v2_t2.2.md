# Checklist Task 2.2: Implement import logic with Sync Guard

- [x] In `lib/holiday-service.ts`, fetch existing holidays for the given `companyId`, `country`, and `year`.
- [x] Implement the "Sync Guard": when syncing, ignore (do not overwrite/delete) any existing holiday date that has `isDeleted: true` (or `deletedAt !== null`) OR has `status: 'VALIDATED'` (or any custom manual overrides).
- [x] Only insert new dates that do not exist yet, defaulting them to `PENDING`.