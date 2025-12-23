-- Add TITLE_REQUESTED to VehicleStatus enum
DO $$ BEGIN
  ALTER TYPE "VehicleStatus" ADD VALUE IF NOT EXISTS 'TITLE_REQUESTED';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

