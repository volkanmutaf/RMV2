-- Add noteCreatedBy and noteCreatedAt columns to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "noteCreatedBy" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "noteCreatedAt" TIMESTAMP(3);

