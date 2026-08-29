-- Add deleted_at column to bulk_request_devices table for soft delete functionality
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bulk_request_devices' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE bulk_request_devices
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create index for faster queries on deleted items
CREATE INDEX IF NOT EXISTS idx_bulk_request_devices_deleted_at ON bulk_request_devices(deleted_at);
