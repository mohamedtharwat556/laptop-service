-- Add technician_id to requests table
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL;

-- Add technician_id to bulk_requests table
ALTER TABLE bulk_requests 
ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL;

-- Add technician_id to company_requests table
ALTER TABLE company_requests 
ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_requests_technician_id ON requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_bulk_requests_technician_id ON bulk_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_company_requests_technician_id ON company_requests(technician_id);
