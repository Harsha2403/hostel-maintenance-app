-- CreateEnum
CREATE TYPE "ParentContactStatus" AS ENUM ('PENDING', 'PHONE_VERIFIED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "parent_contacts" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "ParentContactStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "parent_contact_otp_verifications" (
    "id" TEXT NOT NULL,
    "parentContactId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_contact_otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parent_contact_otp_verifications_parentContactId_idx" ON "parent_contact_otp_verifications"("parentContactId");

-- CreateIndex
CREATE INDEX "parent_contact_otp_verifications_expiresAt_idx" ON "parent_contact_otp_verifications"("expiresAt");

-- CreateIndex
CREATE INDEX "parent_contacts_studentId_idx" ON "parent_contacts"("studentId");

-- CreateIndex
CREATE INDEX "parent_contacts_phone_idx" ON "parent_contacts"("phone");

-- CreateIndex
CREATE INDEX "parent_contacts_status_idx" ON "parent_contacts"("status");

-- AddForeignKey
ALTER TABLE "parent_contact_otp_verifications" ADD CONSTRAINT "parent_contact_otp_verifications_parentContactId_fkey" FOREIGN KEY ("parentContactId") REFERENCES "parent_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
