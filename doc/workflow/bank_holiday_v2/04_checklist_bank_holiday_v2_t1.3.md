# Checklist Task 1.3: Create database migrations

- [x] Create a new migration file for the schema changes. (Created manually to bypass drift error on remote database without resetting it)
- [x] Update the generated migration SQL to backfill existing Bank Holidays (`UPDATE "bank_holidays" SET "year" = CAST(EXTRACT(YEAR FROM "date") AS INTEGER), "status" = 'validated';`).