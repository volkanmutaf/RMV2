-- Create DealType enum
DO $$ BEGIN
  CREATE TYPE "DealType" AS ENUM ('DEPOSIT', 'DEAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create deals table
CREATE TABLE IF NOT EXISTS "deals" (
    "id" TEXT NOT NULL,
    "dealNumber" TEXT NOT NULL,
    "type" "DealType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$ BEGIN
  ALTER TABLE "deals" ADD CONSTRAINT "deals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

