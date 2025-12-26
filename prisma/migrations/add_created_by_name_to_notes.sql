-- Add createdByName column to notes table
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "createdByName" TEXT;

