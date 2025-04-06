/*
  Warnings:

  - Added the required column `generation_job_id` to the `modification_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "modification_jobs" ADD COLUMN     "generation_job_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "modification_jobs" ADD CONSTRAINT "modification_jobs_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "generation_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
