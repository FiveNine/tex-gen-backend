/*
  Warnings:

  - Added the required column `name` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the name column as nullable
ALTER TABLE "users" ADD COLUMN "name" TEXT;

-- Update existing users to have a name based on their email (everything before the @)
UPDATE "users" SET "name" = SPLIT_PART(email, '@', 1);

-- Now make the column required
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
