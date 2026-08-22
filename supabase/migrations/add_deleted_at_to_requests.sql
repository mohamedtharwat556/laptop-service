-- Add deleted_at column to requests table for soft delete functionality
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to bulk_requests table
ALTER TABLE bulk_requests 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add deleted_at column to company_requests table
ALTER TABLE company_requests 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster queries on deleted items
CREATE INDEX IF NOT EXISTS idx_requests_deleted_at ON requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bulk_requests_deleted_at ON bulk_requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_company_requests_deleted_at ON company_requests(deleted_at);
