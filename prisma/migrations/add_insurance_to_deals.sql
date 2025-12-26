-- Add insurance column to deals table
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "insurance" TEXT;

