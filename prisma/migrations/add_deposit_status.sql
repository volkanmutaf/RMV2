-- Add DEPOSIT to VehicleStatus enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DEPOSIT' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VehicleStatus')
    ) THEN
        ALTER TYPE "VehicleStatus" ADD VALUE 'DEPOSIT';
    END IF;
END $$;

