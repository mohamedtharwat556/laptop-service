-- Add employee_name column to company_requests table
ALTER TABLE company_requests ADD COLUMN IF NOT EXISTS employee_name TEXT;

-- Add deleted_at column if not exists
ALTER TABLE company_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for deleted_at
CREATE INDEX IF NOT EXISTS idx_company_requests_deleted_at ON company_requests(deleted_at);
