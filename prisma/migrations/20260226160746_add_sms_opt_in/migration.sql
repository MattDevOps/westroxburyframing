-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "smsOptIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "smsOptInAt" TIMESTAMP(3);
