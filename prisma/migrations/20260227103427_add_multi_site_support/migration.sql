-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "locationId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- Create default location for existing data
INSERT INTO "Location" ("id", "name", "code", "active", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'West Roxbury Framing', 'WRF', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Assign existing orders to default location
UPDATE "Order" SET "locationId" = '00000000-0000-0000-0000-000000000001' WHERE "locationId" IS NULL;

-- Assign existing inventory items to default location (if any exist)
UPDATE "InventoryItem" SET "locationId" = '00000000-0000-0000-0000-000000000001' WHERE "locationId" IS NULL;

-- CreateIndex
CREATE INDEX "InventoryItem_locationId_idx" ON "InventoryItem"("locationId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_locationId_idx" ON "PurchaseOrder"("locationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
