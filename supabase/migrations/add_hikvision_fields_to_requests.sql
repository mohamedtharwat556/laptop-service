-- Add Hikvision-specific fields to requests table
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS estimated_completion_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add index for severity for faster filtering
CREATE INDEX IF NOT EXISTS idx_requests_severity ON requests(severity);
