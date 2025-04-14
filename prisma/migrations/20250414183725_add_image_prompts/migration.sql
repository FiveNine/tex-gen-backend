/*
  Warnings:

  - You are about to drop the column `image_paths` on the `generation_jobs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "generation_jobs" DROP COLUMN "image_paths",
ADD COLUMN     "promptImages" TEXT[];

-- AlterTable
ALTER TABLE "modification_jobs" ADD COLUMN     "promptImages" TEXT[];
