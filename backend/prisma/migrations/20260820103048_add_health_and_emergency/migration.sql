-- CreateEnum
CREATE TYPE "HealthRequestType" AS ENUM ('ILLNESS', 'INJURY', 'MEDICAL_ASSISTANCE', 'EMERGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "HealthPriority" AS ENUM ('NORMAL', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "HealthRequestStatus" AS ENUM ('REPORTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EmergencySeverity" AS ENUM ('HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ParentNotificationType" AS ENUM ('SMS', 'PUSH', 'EMAIL');

-- CreateEnum
CREATE TYPE "ParentNotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "health_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "requestType" "HealthRequestType" NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "HealthPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "HealthRequestStatus" NOT NULL DEFAULT 'REPORTED',
    "handledById" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergencies" (
    "id" TEXT NOT NULL,
    "healthRequestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "severity" "EmergencySeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "handledById" TEXT,
    "reportedById" TEXT NOT NULL,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_notifications" (
    "id" TEXT NOT NULL,
    "emergencyId" TEXT NOT NULL,
    "parentContactId" TEXT NOT NULL,
    "notificationType" "ParentNotificationType" NOT NULL,
    "status" "ParentNotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_requests_studentId_idx" ON "health_requests"("studentId");

-- CreateIndex
CREATE INDEX "health_requests_status_idx" ON "health_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "emergencies_healthRequestId_key" ON "emergencies"("healthRequestId");

-- CreateIndex
CREATE INDEX "emergencies_studentId_idx" ON "emergencies"("studentId");

-- CreateIndex
CREATE INDEX "emergencies_status_idx" ON "emergencies"("status");

-- CreateIndex
CREATE INDEX "parent_notifications_emergencyId_idx" ON "parent_notifications"("emergencyId");

-- CreateIndex
CREATE INDEX "parent_notifications_parentContactId_idx" ON "parent_notifications"("parentContactId");

-- AddForeignKey
ALTER TABLE "health_requests" ADD CONSTRAINT "health_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_requests" ADD CONSTRAINT "health_requests_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_healthRequestId_fkey" FOREIGN KEY ("healthRequestId") REFERENCES "health_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergencies" ADD CONSTRAINT "emergencies_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_notifications" ADD CONSTRAINT "parent_notifications_emergencyId_fkey" FOREIGN KEY ("emergencyId") REFERENCES "emergencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_notifications" ADD CONSTRAINT "parent_notifications_parentContactId_fkey" FOREIGN KEY ("parentContactId") REFERENCES "parent_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
