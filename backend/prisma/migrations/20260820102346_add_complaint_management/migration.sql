-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ComplaintAttachmentType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "complaint_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "complaintNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_attachments" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "ComplaintAttachmentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_assignments" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_status_history" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "oldStatus" "ComplaintStatus",
    "newStatus" "ComplaintStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_resolutions" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "resolvedBy" TEXT NOT NULL,
    "resolutionNote" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaint_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_feedback" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaint_categories_name_key" ON "complaint_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_complaintNo_key" ON "complaints"("complaintNo");

-- CreateIndex
CREATE INDEX "complaints_studentId_idx" ON "complaints"("studentId");

-- CreateIndex
CREATE INDEX "complaints_categoryId_idx" ON "complaints"("categoryId");

-- CreateIndex
CREATE INDEX "complaints_roomId_idx" ON "complaints"("roomId");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaint_assignments_complaintId_idx" ON "complaint_assignments"("complaintId");

-- CreateIndex
CREATE INDEX "complaint_assignments_assignedTo_idx" ON "complaint_assignments"("assignedTo");

-- CreateIndex
CREATE INDEX "complaint_status_history_complaintId_idx" ON "complaint_status_history"("complaintId");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_resolutions_complaintId_key" ON "complaint_resolutions"("complaintId");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_feedback_complaintId_key" ON "complaint_feedback"("complaintId");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "complaint_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_attachments" ADD CONSTRAINT "complaint_attachments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_assignments" ADD CONSTRAINT "complaint_assignments_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_status_history" ADD CONSTRAINT "complaint_status_history_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_resolutions" ADD CONSTRAINT "complaint_resolutions_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_feedback" ADD CONSTRAINT "complaint_feedback_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
