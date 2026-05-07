CREATE TABLE IF NOT EXISTS "workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workflows_company_id_idx"
ON "workflows"("company_id");
