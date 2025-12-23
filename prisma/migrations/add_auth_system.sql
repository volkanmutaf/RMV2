-- Add password and username to users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Create unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- Update UserRole enum to include EDITOR
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in transaction, so we'll handle this separately
-- First, let's check if we need to add EDITOR (this will be done via Prisma)

-- Add lastUpdatedBy to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "lastUpdatedBy" TEXT;

-- Update existing users: if email exists, use it as username temporarily
-- This is a one-time migration for existing data
UPDATE "users" SET "username" = "email" WHERE "username" IS NULL AND "email" IS NOT NULL;

