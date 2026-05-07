-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "qboCustomerId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "qboInvoiceId" TEXT,
ADD COLUMN     "qboSyncToken" TEXT,
ADD COLUMN     "qboSyncedAt" TIMESTAMP(3);
