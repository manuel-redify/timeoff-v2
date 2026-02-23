-- AlterTable
ALTER TABLE "user_project" ADD COLUMN     "area_id" TEXT;

-- CreateIndex
CREATE INDEX "user_project_area_id_idx" ON "user_project"("area_id");

-- AddForeignKey
ALTER TABLE "user_project" ADD CONSTRAINT "user_project_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
