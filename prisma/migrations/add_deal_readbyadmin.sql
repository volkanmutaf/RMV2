-- Add readByAdmin column to deals table
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "readByAdmin" BOOLEAN NOT NULL DEFAULT false;

