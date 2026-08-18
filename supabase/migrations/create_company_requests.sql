-- Create company_requests table
CREATE TABLE IF NOT EXISTS company_requests (
    id BIGSERIAL PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    laptop_brand TEXT NOT NULL,
    laptop_model TEXT,
    serial_number TEXT,
    received_date DATE,
    problem_description TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Received',
    admin_reply TEXT,
    technician TEXT,
    technician_notes TEXT,
    cost DECIMAL(10, 2) DEFAULT 0,
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_requests_status ON company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_created_at ON company_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_requests_phone ON company_requests(phone);

-- Enable RLS
ALTER TABLE company_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all access to company_requests" ON company_requests
    FOR ALL USING (true)
    WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_requests_updated_at BEFORE UPDATE
    ON company_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
