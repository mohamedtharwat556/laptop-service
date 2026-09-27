-- Add recorded_by column to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS recorded_by TEXT;

-- Add recorded_by column to bulk_requests table
ALTER TABLE bulk_requests ADD COLUMN IF NOT EXISTS recorded_by TEXT;

-- Add recorded_by column to company_requests table
ALTER TABLE company_requests ADD COLUMN IF NOT EXISTS recorded_by TEXT;
