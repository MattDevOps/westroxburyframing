-- CreateEnum
CREATE TYPE "LeadVertical" AS ENUM ('designer', 'law_firm', 'photographer', 'hospital', 'hotel', 'gallery', 'school', 'funeral_home', 'real_estate_stager', 'corporate', 'other');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'researching', 'ready_to_email', 'emailed', 'followed_up', 'replied_positive', 'replied_negative', 'no_reply', 'qualified', 'customer', 'unsubscribed', 'bounced');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "companyName" TEXT,
    "website" TEXT,
    "linkedinUrl" TEXT,
    "city" TEXT,
    "state" TEXT DEFAULT 'MA',
    "neighborhood" TEXT,
    "vertical" "LeadVertical" NOT NULL DEFAULT 'designer',
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "source" TEXT,
    "notes" TEXT,
    "assignedToUserId" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "emailedAt" TIMESTAMP(3),
    "repliedAt" TIMESTAMP(3),
    "replyText" TEXT,
    "replyClassification" TEXT,
    "nextFollowUpAt" TIMESTAMP(3),
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "lastFollowUpAt" TIMESTAMP(3),
    "convertedCustomerId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_vertical_idx" ON "Lead"("vertical");

-- CreateIndex
CREATE INDEX "Lead_assignedToUserId_idx" ON "Lead"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Lead_emailedAt_idx" ON "Lead"("emailedAt");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_convertedCustomerId_fkey" FOREIGN KEY ("convertedCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
