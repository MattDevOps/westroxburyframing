-- Pending-draft fields on Lead, used by the review-before-send queue.
-- bulk-send and cron lead-followups now write here instead of sending immediately.
ALTER TABLE "Lead"
  ADD COLUMN "draftSubject"   TEXT,
  ADD COLUMN "draftBody"      TEXT,
  ADD COLUMN "draftMode"      TEXT,
  ADD COLUMN "draftSource"    TEXT,
  ADD COLUMN "draftCreatedAt" TIMESTAMP(3);

CREATE INDEX "Lead_draftCreatedAt_idx" ON "Lead"("draftCreatedAt");
