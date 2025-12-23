-- Add preInspection column to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "preInspection" BOOLEAN NOT NULL DEFAULT false;

