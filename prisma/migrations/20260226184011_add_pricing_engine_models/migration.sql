-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorCatalogItem" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "costPerUnit" DECIMAL(65,30) NOT NULL,
    "retailPerUnit" DECIMAL(65,30),
    "discontinued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "baseRate" DECIMAL(65,30) NOT NULL,
    "minCharge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "wastePercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "multiplier" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_code_key" ON "Vendor"("code");

-- CreateIndex
CREATE UNIQUE INDEX "VendorCatalogItem_vendorId_itemNumber_key" ON "VendorCatalogItem"("vendorId", "itemNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PriceCode_code_key" ON "PriceCode"("code");

-- AddForeignKey
ALTER TABLE "VendorCatalogItem" ADD CONSTRAINT "VendorCatalogItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
