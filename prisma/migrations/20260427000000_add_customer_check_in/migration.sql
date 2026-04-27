-- AlterTable
ALTER TABLE "Customer"
  ADD COLUMN "lastCheckedInAt" TIMESTAMP(3),
  ADD COLUMN "checkInHistory" JSONB NOT NULL DEFAULT '[]';
