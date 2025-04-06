/*
  Warnings:

  - The `genImages` column on the `generation_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `images` column on the `modification_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "generation_jobs" DROP COLUMN "genImages",
ADD COLUMN     "genImages" TEXT[];

-- AlterTable
ALTER TABLE "modification_jobs" DROP COLUMN "images",
ADD COLUMN     "images" TEXT[];
