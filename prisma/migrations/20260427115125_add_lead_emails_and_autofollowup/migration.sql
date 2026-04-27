-- CreateEnum
CREATE TYPE "LeadEmailDirection" AS ENUM ('outbound', 'inbound');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "autoFollowupAt" TIMESTAMP(3),
ADD COLUMN     "autoFollowupSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LeadEmail" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "direction" "LeadEmailDirection" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fromAddr" TEXT,
    "toAddr" TEXT,
    "sentByUserId" TEXT,
    "postmarkMessageId" TEXT,
    "outboundKind" TEXT,
    "postmarkInboundId" TEXT,
    "classification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadEmail_leadId_idx" ON "LeadEmail"("leadId");

-- CreateIndex
CREATE INDEX "LeadEmail_direction_idx" ON "LeadEmail"("direction");

-- CreateIndex
CREATE INDEX "LeadEmail_createdAt_idx" ON "LeadEmail"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_autoFollowupAt_idx" ON "Lead"("autoFollowupAt");

-- AddForeignKey
ALTER TABLE "LeadEmail" ADD CONSTRAINT "LeadEmail_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEmail" ADD CONSTRAINT "LeadEmail_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
