-- Complete Migration for Authentication and Tracking System
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Users Table Updates
-- ============================================
-- First, copy email to username if email column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        -- Update username from email before dropping email column
        UPDATE "users" SET "username" = "email" WHERE "username" IS NULL AND "email" IS NOT NULL;
    END IF;
END $$;

-- Add password and username to users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "email";
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

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

