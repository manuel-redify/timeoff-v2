ALTER TABLE "leave_requests"
ADD COLUMN IF NOT EXISTS "duration_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "action_token" TEXT,
ADD COLUMN IF NOT EXISTS "action_token_expiry" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "leave_requests_action_token_key"
ON "leave_requests"("action_token");
