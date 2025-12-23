-- Complete Migration for Authentication and Tracking System
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Users Table Updates
-- ============================================
-- Add password and username to users table
-- Note: If you have existing users, you'll need to manually set their username via the admin panel
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Drop email column if it exists (safe to do after username is added)
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";

-- Create unique index for username
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- ============================================
-- 2. UserRole Enum Update
-- ============================================
-- Add EDITOR to UserRole enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'EDITOR' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'EDITOR';
    END IF;
END $$;

-- ============================================
-- 3. Transactions Table Updates
-- ============================================
-- Add lastUpdatedBy to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "lastUpdatedBy" TEXT;

-- Add lastUpdatedAt to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "lastUpdatedAt" TIMESTAMP;

-- ============================================
-- 4. Update Existing Users (if needed)
-- ============================================
-- This step is already handled in step 1 above

-- ============================================
-- Migration Complete!
-- ============================================

