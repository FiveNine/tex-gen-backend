/*
  Warnings:

  - You are about to drop the column `result` on the `generation_jobs` table. All the data in the column will be lost.
  - Added the required column `size` to the `generation_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "generation_jobs" DROP COLUMN "result",
ADD COLUMN     "genImages" TEXT[],
ADD COLUMN     "size" TEXT NOT NULL;
