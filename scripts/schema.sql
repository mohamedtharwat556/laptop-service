-- YAS Laptop Service - Database Schema
-- Run this in Supabase SQL Editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY DEFAULT gen_random_bytes(8)::bigint,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'technician')),
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Create requests table
CREATE TABLE IF NOT EXISTS requests (
    id BIGINT PRIMARY KEY DEFAULT gen_random_bytes(8)::bigint,
    request_number TEXT UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    device_type TEXT,
    laptop_brand TEXT,
    laptop_model TEXT,
    problem_description TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT DEFAULT 'Received' CHECK (status IN ('Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts', 'Ready', 'Delivered')),
    cost NUMERIC DEFAULT 0,
    estimated_completion_date DATE,
    device_image TEXT,
    repair_images TEXT[] DEFAULT '{}',
    replacement_parts TEXT[] DEFAULT '{}',
    notes TEXT,
    technician_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_phone ON requests(phone);
CREATE INDEX IF NOT EXISTS idx_requests_email ON requests(email);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

-- 3. Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY DEFAULT gen_random_bytes(8)::bigint,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    stock INT DEFAULT 0,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 4. Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT PRIMARY KEY DEFAULT gen_random_bytes(8)::bigint,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    request_id BIGINT REFERENCES requests(id) ON DELETE SET NULL,
    total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 5. Seed sample data
INSERT INTO users (username, email, name, role) VALUES
    ('admin', 'admin@yas.com', 'System Administrator', 'admin'),
    ('tech1', 'tech@yas.com', 'محمد الفني', 'technician')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, category, description, price, stock) VALUES
    ('لابتوب HP', 'Laptop', 'لابتوب HP Pavilion', 5000, 10),
    ('لابتوب Dell', 'Laptop', 'لابتوب Dell Inspiron', 4500, 8),
    ('شاشة LCD', 'Screen', 'شاشة LCD 15 بوصة', 1200, 15),
    ('بطارية', 'Battery', 'بطارية اصلية', 800, 20),
    ('لوحة الأم', 'Motherboard', 'لوحة أم', 2500, 5)
ON CONFLICT DO NOTHING;

INSERT INTO requests (request_number, full_name, phone, email, laptop_brand, laptop_model, problem_description, status, priority) VALUES
    ('REQ-001', 'أحمد محمد', '01001234567', 'ahmed@example.com', 'HP', 'Pavilion 15', 'الجهاز لا يشغل', 'Received', 'High'),
    ('REQ-002', 'فاطمة علي', '01101234567', 'fatima@example.com', 'Dell', 'Inspiron 15', 'بطء في الأداء', 'Under Maintenance', 'Medium'),
    ('REQ-003', 'محمود حسن', '01201234567', 'mahmoud@example.com', 'Lenovo', 'ThinkPad', 'الشاشة مكسورة', 'Waiting Parts', 'High')
ON CONFLICT (request_number) DO NOTHING;

-- 6. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public read for now)
CREATE POLICY "Enable read access for all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON requests
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON products
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON requests
    FOR UPDATE USING (true);

CREATE POLICY "Enable update for all users" ON orders
    FOR UPDATE USING (true);
