-- Create company_requests table
CREATE TABLE IF NOT EXISTS company_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_phone VARCHAR(20) NOT NULL,
    company_email VARCHAR(255),
    commercial_register VARCHAR(100),
    contact_person VARCHAR(255),
    contact_person_phone VARCHAR(20),
    laptop_brand VARCHAR(100) NOT NULL,
    laptop_model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    received_date DATE NOT NULL,
    problem_description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'Received',
    admin_reply TEXT,
    technician VARCHAR(255),
    technician_notes TEXT,
    cost DECIMAL(10, 2) DEFAULT 0,
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on request_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_requests_request_number ON company_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_company_requests_company_phone ON company_requests(company_phone);
CREATE INDEX IF NOT EXISTS idx_company_requests_status ON company_requests(status);

-- Enable Row Level Security
ALTER TABLE company_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for company_requests
CREATE POLICY "Public read access for company requests" ON company_requests
    FOR SELECT USING (true);

CREATE POLICY "Public insert for company requests" ON company_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update for company requests" ON company_requests
    FOR UPDATE USING (true);

CREATE POLICY "Public delete for company requests" ON company_requests
    FOR DELETE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_company_requests_updated_at
    BEFORE UPDATE ON company_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
