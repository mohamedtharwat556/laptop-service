-- Add device-specific fields to bulk_request_devices
ALTER TABLE bulk_request_devices 
ADD COLUMN IF NOT EXISTS admin_reply TEXT,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS technician VARCHAR(255),
ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE;
