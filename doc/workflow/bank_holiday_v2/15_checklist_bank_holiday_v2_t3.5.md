# Checklist Task 3.5: Implement Soft Delete and Manual Addition

- [x] Update the `onDelete` function/API in `app/(dashboard)/settings/holidays/page.tsx` to perform a soft delete (`isDeleted: true` or set `deletedAt`) instead of a physical deletion.
- [x] Ensure the UI Table filters out soft-deleted holidays.
- [x] Ensure the "Add Holiday" form correctly tags manually added holidays as `VALIDATED` (so they bypass the Sync Guard logic).