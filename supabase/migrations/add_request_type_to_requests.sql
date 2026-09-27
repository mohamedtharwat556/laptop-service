-- Add request_type column to requests table
ALTER TABLE requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'normal';

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_requests_request_type ON requests(request_type);
