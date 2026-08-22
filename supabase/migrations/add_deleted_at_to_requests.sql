-- Add deleted_at column to requests table for soft delete functionality
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'requests' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE requests
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add deleted_at column to bulk_requests table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bulk_requests' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE bulk_requests
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add deleted_at column to company_requests table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_requests' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE company_requests
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for faster queries on deleted items
CREATE INDEX IF NOT EXISTS idx_requests_deleted_at ON requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bulk_requests_deleted_at ON bulk_requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_company_requests_deleted_at ON company_requests(deleted_at);
