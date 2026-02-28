-- Add performance indexes for common queries

-- Index for orders by updatedAt (used in order list sorting)
CREATE INDEX IF NOT EXISTS "Order_updatedAt_idx" ON "Order"("updatedAt");

-- Index for orders by dueDate (used in overdue orders queries)
CREATE INDEX IF NOT EXISTS "Order_dueDate_idx" ON "Order"("dueDate");

-- Composite index for location + status + createdAt (dashboard queries)
CREATE INDEX IF NOT EXISTS "Order_locationId_status_createdAt_idx" ON "Order"("locationId", "status", "createdAt");

-- Index for customer orders by status (lifetime value calculations)
CREATE INDEX IF NOT EXISTS "Order_customerId_status_idx" ON "Order"("customerId", "status");

-- Index for invoice status queries
CREATE INDEX IF NOT EXISTS "Invoice_status_createdAt_idx" ON "Invoice"("status", "createdAt");

-- Index for order activity by order and date
CREATE INDEX IF NOT EXISTS "OrderActivity_orderId_createdAt_idx" ON "OrderActivity"("orderId", "createdAt");
