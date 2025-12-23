-- Add isUrgent column to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "isUrgent" BOOLEAN NOT NULL DEFAULT false;

