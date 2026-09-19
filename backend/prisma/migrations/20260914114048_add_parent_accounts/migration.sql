/*
  Warnings:

  - Made the column `Gender` on table `students` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PARENT';

-- AlterTable
ALTER TABLE "parent_contacts" ADD COLUMN     "parentUserId" TEXT;

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "Gender" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "parent_contacts" ADD CONSTRAINT "parent_contacts_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
