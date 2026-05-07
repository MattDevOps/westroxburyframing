-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'retail',
    "artistId" TEXT,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "retailPrice" INTEGER NOT NULL DEFAULT 0,
    "quantityOnHand" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reorderPoint" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "barcode" TEXT,
    "notes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_type_idx" ON "Product"("type");

-- CreateIndex
CREATE INDEX "Product_artistId_idx" ON "Product"("artistId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
