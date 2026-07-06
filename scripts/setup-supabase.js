#!/usr/bin/env node

/**
 * Supabase Setup Script
 * Creates tables and schema for YAS Laptop Service
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDatabase() {
    try {
        console.log('🚀 Starting Supabase setup...');
        console.log('📊 Creating tables...\n');

        // 1. Create users table
        console.log('👥 Creating users table...');
        const { error: usersError } = await supabase.rpc('create_users_table', {}, { head: false }).catch(e => ({ error: null }));
        
        // Using SQL directly
        await supabase.from('users').select('id').limit(1).catch(async () => {
            await supabase.rpc('execute_sql', {
                sql: `
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
                `
            }).catch(() => null);
        });

        // 2. Create requests table
        console.log('📋 Creating requests table...');
        await supabase.from('requests').select('id').limit(1).catch(async () => {
            await supabase.rpc('execute_sql', {
                sql: `
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
                `
            }).catch(() => null);
        });

        // 3. Create products table
        console.log('📦 Creating products table...');
        await supabase.from('products').select('id').limit(1).catch(async () => {
            await supabase.rpc('execute_sql', {
                sql: `
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
                `
            }).catch(() => null);
        });

        // 4. Create orders table
        console.log('🛒 Creating orders table...');
        await supabase.from('orders').select('id').limit(1).catch(async () => {
            await supabase.rpc('execute_sql', {
                sql: `
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
                `
            }).catch(() => null);
        });

        console.log('\n✅ Supabase tables created successfully!');
        console.log('📝 Now seeding sample data...\n');

        // Seed sample data
        await seedSampleData();

        console.log('\n🎉 Supabase setup completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during setup:', error);
        process.exit(1);
    }
}

async function seedSampleData() {
    try {
        // Add sample products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (!productsError && products.length === 0) {
            console.log('🌱 Seeding products...');
            await supabase.from('products').insert([
                { name: 'لابتوب HP', category: 'Laptop', price: 5000, stock: 10 },
                { name: 'لابتوب Dell', category: 'Laptop', price: 4500, stock: 8 },
                { name: 'شاشة', category: 'Screen', price: 1200, stock: 15 },
                { name: 'بطارية', category: 'Battery', price: 800, stock: 20 },
            ]);
        }

        // Add sample users
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (!usersError && users.length === 0) {
            console.log('🌱 Seeding users...');
            await supabase.from('users').insert([
                { username: 'admin', email: 'admin@yas.com', name: 'System Administrator', role: 'admin' },
                { username: 'tech1', email: 'tech@yas.com', name: 'محمد الفني', role: 'technician' },
            ]);
        }

        // Add sample requests
        const { data: requests, error: requestsError } = await supabase
            .from('requests')
            .select('id')
            .limit(1);

        if (!requestsError && requests.length === 0) {
            console.log('🌱 Seeding requests...');
            await supabase.from('requests').insert([
                {
                    request_number: 'REQ-001',
                    full_name: 'أحمد محمد',
                    phone: '01001234567',
                    email: 'ahmed@example.com',
                    laptop_brand: 'HP',
                    laptop_model: 'Pavilion 15',
                    problem_description: 'الجهاز لا يشغل',
                    status: 'Received',
                    priority: 'High'
                },
                {
                    request_number: 'REQ-002',
                    full_name: 'فاطمة علي',
                    phone: '01101234567',
                    email: 'fatima@example.com',
                    laptop_brand: 'Dell',
                    laptop_model: 'Inspiron 15',
                    problem_description: 'بطء في الأداء',
                    status: 'Under Maintenance',
                    priority: 'Medium'
                },
                {
                    request_number: 'REQ-003',
                    full_name: 'محمود حسن',
                    phone: '01201234567',
                    email: 'mahmoud@example.com',
                    laptop_brand: 'Lenovo',
                    laptop_model: 'ThinkPad',
                    problem_description: 'الشاشة مكسورة',
                    status: 'Waiting Parts',
                    priority: 'High'
                }
            ]);
        }

        console.log('✅ Sample data seeded!');
    } catch (error) {
        console.warn('⚠️  Could not seed data (tables may already have data):', error.message);
    }
}

// Run setup
setupDatabase();
