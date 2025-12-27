-- Add noteType, noteApproved, noteApprovedBy, noteApprovedAt columns to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "noteType" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "noteApproved" BOOLEAN DEFAULT false;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "noteApprovedBy" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "noteApprovedAt" TIMESTAMP(3);

