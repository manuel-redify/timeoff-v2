# Checklist Task 1.2: Ensure User and Company models support Country mapping

- [x] Verify `Company` model has `country` field (Already exists as `String @db.Char(2)`).
- [x] Verify `User` model has `country` field (Already exists as `String? @db.Char(2)`).
- [x] No database changes required here, just validating schema alignment with PRD.