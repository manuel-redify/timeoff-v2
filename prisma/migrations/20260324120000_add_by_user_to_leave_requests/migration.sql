-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN "by_user_id" TEXT;

-- CreateIndex
CREATE INDEX "leave_requests_by_user_id_idx" ON "leave_requests"("by_user_id");

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_by_user_id_fkey" FOREIGN KEY ("by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
