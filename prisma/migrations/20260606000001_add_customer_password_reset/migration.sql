-- Add password-reset token fields to Customer
ALTER TABLE "Customer" ADD COLUMN "resetTokenHash" TEXT;
ALTER TABLE "Customer" ADD COLUMN "resetTokenExpiresAt" TIMESTAMP(3);
