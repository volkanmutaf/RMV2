-- Add noteArchived column to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "noteArchived" BOOLEAN DEFAULT false;

