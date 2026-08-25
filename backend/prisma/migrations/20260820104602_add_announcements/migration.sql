-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'BOYS', 'GIRLS', 'SPECIFIC_BUILDING', 'SPECIFIC_BLOCK');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "hostelBuildingId" TEXT,
    "blockId" TEXT,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "announcements_audience_idx" ON "announcements"("audience");

-- CreateIndex
CREATE INDEX "announcements_hostelBuildingId_idx" ON "announcements"("hostelBuildingId");

-- CreateIndex
CREATE INDEX "announcements_blockId_idx" ON "announcements"("blockId");

-- CreateIndex
CREATE INDEX "announcements_isActive_idx" ON "announcements"("isActive");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_hostelBuildingId_fkey" FOREIGN KEY ("hostelBuildingId") REFERENCES "hostel_buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
