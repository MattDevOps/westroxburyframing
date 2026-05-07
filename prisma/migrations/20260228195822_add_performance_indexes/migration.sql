-- CreateIndex
CREATE INDEX "Order_updatedAt_idx" ON "Order"("updatedAt");

-- CreateIndex
CREATE INDEX "Order_dueDate_idx" ON "Order"("dueDate");

-- CreateIndex
CREATE INDEX "Order_locationId_status_createdAt_idx" ON "Order"("locationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_customerId_status_idx" ON "Order"("customerId", "status");

-- CreateIndex
CREATE INDEX "OrderActivity_orderId_createdAt_idx" ON "OrderActivity"("orderId", "createdAt");
