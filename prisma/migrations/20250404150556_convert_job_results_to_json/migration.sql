/*
  Warnings:

  - Changed the type of `genImages` on the `generation_jobs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "generation_jobs" DROP COLUMN "genImages",
ADD COLUMN     "genImages" JSONB NOT NULL;
