-- CreateEnum
CREATE TYPE "BankHolidayStatus" AS ENUM ('pending', 'validated');

-- AlterTable
ALTER TABLE "bank_holidays" ADD COLUMN "status" "BankHolidayStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "bank_holidays" ADD COLUMN "year" INTEGER;

-- Backfill
UPDATE "bank_holidays" SET "year" = CAST(EXTRACT(YEAR FROM "date") AS INTEGER), "status" = 'validated';

-- Make year NOT NULL
ALTER TABLE "bank_holidays" ALTER COLUMN "year" SET NOT NULL;

-- CreateIndex
CREATE INDEX "bank_holidays_year_idx" ON "bank_holidays"("year");