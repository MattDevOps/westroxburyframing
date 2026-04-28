-- CreateTable
CREATE TABLE "RecallCampaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startMonth" INTEGER NOT NULL,
    "startDay" INTEGER NOT NULL,
    "endMonth" INTEGER NOT NULL,
    "endDay" INTEGER NOT NULL,
    "segmentRule" JSONB NOT NULL DEFAULT '{}',
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastRunAt" TIMESTAMP(3),
    "perRunCap" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecallCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallCampaignSend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "campaignYear" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "renderedSubject" TEXT NOT NULL,
    "renderedBodyHtml" TEXT NOT NULL,
    "renderedBodyText" TEXT,
    "draftedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "postmarkMessageId" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "RecallCampaignSend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecallCampaign_slug_key" ON "RecallCampaign"("slug");

-- CreateIndex
CREATE INDEX "RecallCampaign_enabled_idx" ON "RecallCampaign"("enabled");

-- CreateIndex
CREATE INDEX "RecallCampaignSend_status_idx" ON "RecallCampaignSend"("status");

-- CreateIndex
CREATE INDEX "RecallCampaignSend_campaignId_status_idx" ON "RecallCampaignSend"("campaignId", "status");

-- CreateIndex
CREATE INDEX "RecallCampaignSend_customerId_idx" ON "RecallCampaignSend"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "RecallCampaignSend_campaignId_customerId_campaignYear_key" ON "RecallCampaignSend"("campaignId", "customerId", "campaignYear");

-- AddForeignKey
ALTER TABLE "RecallCampaignSend" ADD CONSTRAINT "RecallCampaignSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "RecallCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallCampaignSend" ADD CONSTRAINT "RecallCampaignSend_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
