/*
  Warnings:

  - Added the required column `modifications` to the `modification_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "modification_jobs" ADD COLUMN     "modifications" INTEGER NOT NULL;
