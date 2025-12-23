-- Add lastUpdatedAt column to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "lastUpdatedAt" TIMESTAMP;

