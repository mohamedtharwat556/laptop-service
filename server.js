require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const supabase = require('./config/db');
// Laptop Service - Updated

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// Performance middleware
app.use(compression());

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - disabled for testing
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: { error: 'Too many requests from this IP, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skip: (req) => {
//     return req.path === '/api/health';
//   }
// });
// app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize database (localStorage mode only)
console.log('🔧 Running in localStorage mode - no database required');
console.log('📝 All data will be stored in browser localStorage');

// Simple test endpoint (no middleware)
app.get('/test', (req, res) => {
    res.json({ 
        test: 'working',
        mode: 'localStorage'
    });
});

// ============ API ROUTES ============

// Import routes
const usersRoutes = require('./routes/users');
const requestsRoutes = require('./routes/requests');
const productsRoutes = require('./routes/products');
const bulkRequestsRoutes = require('./routes/bulk-requests');
const companyRequestsRoutes = require('./routes/company-requests');

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all data (localStorage mode - returns empty, client uses localStorage)
app.get('/api/data', (req, res) => {
    console.log('📊 API data endpoint - returning empty (using localStorage)');
    res.json({
        users: [],
        requests: [],
        products: [],
        orders: [],
        categories: []
    });
});

// Save/merge all data (legacy support)
app.post('/api/data', async (req, res) => {
    try {
        const clientData = req.body;
        // Data is now managed via Supabase
        res.json({ success: true });
    } catch (error) {
        console.error('API sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Use routes
app.use('/api/users', usersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/bulk-requests', bulkRequestsRoutes);
app.use('/api/company-requests', companyRequestsRoutes);

// ============ GLOBAL SEARCH API ============
// Enhanced global search endpoint with server-side filtering
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.json({ requests: [], bulkRequests: [], companyRequests: [] });
        }

        const searchTerm = q.toLowerCase().trim();
        console.log('🔍 Global search for:', searchTerm);

        // Parallel search across all tables
        const [requestsData, bulkRequestsData, companyRequestsData] = await Promise.all([
            supabase.from('requests').select('*').is('deleted_at', null),
            supabase.from('bulk_requests').select('*').is('deleted_at', null),
            supabase.from('company_requests').select('*').is('deleted_at', null)
        ]);

        // Filter normal requests
        const requests = (requestsData.data || []).filter(r => {
            return (r.serial_number || '').toLowerCase().includes(searchTerm) ||
                   (r.full_name || '').toLowerCase().includes(searchTerm) ||
                   (r.request_number || '').toLowerCase().includes(searchTerm) ||
                   (r.phone || '').includes(searchTerm) ||
                   (r.email || '').toLowerCase().includes(searchTerm) ||
                   (r.laptop_brand || '').toLowerCase().includes(searchTerm) ||
                   (r.laptop_model || '').toLowerCase().includes(searchTerm) ||
                   (r.status || '').toLowerCase().includes(searchTerm) ||
                   (r.priority || '').toLowerCase().includes(searchTerm);
        }).map(r => ({
            id: r.id,
            requestNumber: r.request_number,
            fullName: r.full_name,
            phone: r.phone,
            email: r.email || '',
            laptopBrand: r.laptop_brand,
            laptopModel: r.laptop_model,
            serialNumber: r.serial_number,
            status: r.status,
            priority: r.priority,
            createdAt: r.created_at,
            cost: r.cost
        }));

        // Filter bulk requests with device search
        const bulkRequestsWithDevices = await Promise.all(
            (bulkRequestsData.data || []).map(async (bulkReq) => {
                const { data: devices } = await supabase
                    .from('bulk_request_devices')
                    .select('*')
                    .eq('bulk_request_id', bulkReq.id);

                return { ...bulkReq, devices: devices || [] };
            })
        );

        const bulkRequests = bulkRequestsWithDevices.filter(r => {
            const devices = r.devices || [];
            const hasMatchingDevice = devices.some(d =>
                (d.serial_number || '').toLowerCase().includes(searchTerm) ||
                (d.laptop_brand || '').toLowerCase().includes(searchTerm) ||
                (d.laptop_model || '').toLowerCase().includes(searchTerm)
            );

            return hasMatchingDevice ||
                   (r.customer_name || '').toLowerCase().includes(searchTerm) ||
                   (r.request_number || '').toLowerCase().includes(searchTerm) ||
                   (r.customer_phone || '').includes(searchTerm) ||
                   (r.customer_email || '').toLowerCase().includes(searchTerm) ||
                   (r.status || '').toLowerCase().includes(searchTerm) ||
                   (r.priority || '').toLowerCase().includes(searchTerm);
        }).map(r => ({
            id: r.id,
            requestNumber: r.request_number,
            customerName: r.customer_name,
            customerPhone: r.customer_phone,
            customerEmail: r.customer_email || '',
            deviceCount: r.device_count,
            status: r.status,
            priority: r.priority,
            totalCost: r.cost,
            createdAt: r.created_at,
            devices: r.devices.map(d => ({
                serialNumber: d.serial_number,
                laptopBrand: d.laptop_brand,
                laptopModel: d.laptop_model
            }))
        }));

        // Filter company requests
        const companyRequests = (companyRequestsData.data || []).filter(r => {
            return (r.serial_number || '').toLowerCase().includes(searchTerm) ||
                   (r.full_name || '').toLowerCase().includes(searchTerm) ||
                   (r.request_number || '').toLowerCase().includes(searchTerm) ||
                   (r.phone || '').includes(searchTerm) ||
                   (r.laptop_brand || '').toLowerCase().includes(searchTerm) ||
                   (r.laptop_model || '').toLowerCase().includes(searchTerm) ||
                   (r.status || '').toLowerCase().includes(searchTerm) ||
                   (r.priority || '').toLowerCase().includes(searchTerm);
        }).map(r => ({
            id: r.id,
            requestNumber: r.request_number,
            fullName: r.full_name,
            phone: r.phone,
            laptopBrand: r.laptop_brand,
            laptopModel: r.laptop_model,
            serialNumber: r.serial_number,
            status: r.status,
            priority: r.priority,
            createdAt: r.created_at,
            cost: r.cost
        }));

        console.log(`🔍 Search results: ${requests.length} normal, ${bulkRequests.length} bulk, ${companyRequests.length} company`);

        res.json({ requests, bulkRequests, companyRequests });
    } catch (error) {
        console.error('Error in global search:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDERS API ============
app.get('/api/orders', async (req, res) => {
    try {
        console.log('🛒 GET /api/orders');
        const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Order not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = { 
            ...req.body, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('orders').insert([newOrder]).select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('orders').update(req.body).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Order not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CATEGORIES API ============
app.get('/api/categories', async (req, res) => {
    try {
        console.log('🏷️  GET /api/categories');
        const { data, error } = await supabase.from('products').select('category');
        if (error) throw error;
        const categories = [...new Set((data || []).map(p => p.category))];
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ STATS API ============
app.get('/api/stats', async (req, res) => {
    try {
        console.log('📈 GET /api/stats');
        
        const [requestsRes, productsRes, ordersRes, usersRes] = await Promise.all([
            supabase.from('requests').select('id,status'),
            supabase.from('products').select('id'),
            supabase.from('orders').select('total'),
            supabase.from('users').select('id')
        ]);

        const requests = requestsRes.data || [];
        const products = productsRes.data || [];
        const orders = ordersRes.data || [];
        const users = usersRes.data || [];

        const stats = {
            totalRequests: requests.length,
            openRequests: requests.filter(r => 
                ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
            ).length,
            completedRequests: requests.filter(r => r.status === 'Delivered').length,
            totalProducts: products.length,
            totalOrders: orders.length,
            totalUsers: users.length,
            revenue: orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
        };
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve all frontend files as static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve main page on fallback for SPA routes
app.get('*', (req, res) => {
    // Don't redirect API routes
    if (req.path.startsWith('/api') || req.path.startsWith('/test')) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server (only when not running on Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Export for Vercel
module.exports = app;

