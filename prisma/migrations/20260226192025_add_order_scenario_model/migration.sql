-- CreateTable
CREATE TABLE "OrderScenario" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderScenario_orderId_idx" ON "OrderScenario"("orderId");

-- AddForeignKey
ALTER TABLE "OrderComponent" ADD CONSTRAINT "OrderComponent_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "OrderScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderScenario" ADD CONSTRAINT "OrderScenario_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
