-- DropForeignKey
ALTER TABLE "GiftCertificate" DROP CONSTRAINT "GiftCertificate_issuedByUserId_fkey";

-- AlterTable
ALTER TABLE "GiftCertificate" ADD COLUMN     "deliverAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "purchasedByEmail" TEXT,
ADD COLUMN     "purchasedByName" TEXT,
ADD COLUMN     "recipientEmail" TEXT,
ADD COLUMN     "recipientMessage" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "redemptionCode" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "squarePaymentId" TEXT,
ALTER COLUMN "issuedByUserId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GiftCertificate_redemptionCode_key" ON "GiftCertificate"("redemptionCode");

-- CreateIndex
CREATE INDEX "GiftCertificate_redemptionCode_idx" ON "GiftCertificate"("redemptionCode");

-- CreateIndex
CREATE INDEX "GiftCertificate_deliverAt_deliveredAt_idx" ON "GiftCertificate"("deliverAt", "deliveredAt");

-- AddForeignKey
ALTER TABLE "GiftCertificate" ADD CONSTRAINT "GiftCertificate_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
