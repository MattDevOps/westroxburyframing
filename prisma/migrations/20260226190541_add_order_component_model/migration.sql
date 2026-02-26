-- CreateTable
CREATE TABLE "OrderComponent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "scenarioId" TEXT,
    "category" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "priceCodeId" TEXT,
    "vendorItemId" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "lineTotal" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderComponent_orderId_idx" ON "OrderComponent"("orderId");

-- CreateIndex
CREATE INDEX "OrderComponent_scenarioId_idx" ON "OrderComponent"("scenarioId");

-- AddForeignKey
ALTER TABLE "OrderComponent" ADD CONSTRAINT "OrderComponent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderComponent" ADD CONSTRAINT "OrderComponent_priceCodeId_fkey" FOREIGN KEY ("priceCodeId") REFERENCES "PriceCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderComponent" ADD CONSTRAINT "OrderComponent_vendorItemId_fkey" FOREIGN KEY ("vendorItemId") REFERENCES "VendorCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
