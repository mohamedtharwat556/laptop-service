const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const supabase = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'", "https://*.supabase.co"]
    }
  }
}));

// Performance middleware
app.use(compression());

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/health';
  }
});
app.use('/api/', limiter);

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

// ============ USERS API ============
app.get('/api/users', async (req, res) => {
    try {
        console.log('👥 GET /api/users');
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        
        // Convert snake_case to camelCase
        const converted = (data || []).map(item => ({
            id: item.id,
            username: item.username,
            email: item.email,
            name: item.name,
            role: item.role,
            createdAt: item.created_at
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const newUser = { ...req.body, created_at: new Date().toISOString() };
        const { data, error } = await supabase.from('users').insert([newUser]).select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ REQUESTS API ============
app.get('/api/requests', async (req, res) => {
    try {
        console.log('📋 GET /api/requests');
        const { data, error } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        // Convert snake_case to camelCase
        const converted = (data || []).map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            fullName: item.full_name,
            phone: item.phone,
            email: item.email,
            deviceType: item.device_type,
            laptopBrand: item.laptop_brand,
            laptopModel: item.laptop_model,
            problemDescription: item.problem_description,
            priority: item.priority,
            status: item.status,
            cost: item.cost,
            estimatedCompletionDate: item.estimated_completion_date,
            deviceImage: item.device_image,
            repairImages: item.repair_images,
            replacementParts: item.replacement_parts,
            notes: item.notes,
            technicianNotes: item.technician_notes,
            createdAt: item.created_at,
            updatedAt: item.updated_at
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/requests/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('requests').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Request not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/requests', async (req, res) => {
    try {
        const newRequest = { 
            ...req.body, 
            request_number: req.body.request_number || `REQ-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('requests').insert([newRequest]).select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/requests/:id', async (req, res) => {
    try {
        const updateData = { ...req.body, updated_at: new Date().toISOString() };
        const { data, error } = await supabase.from('requests').update(updateData).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Request not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/requests/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('requests').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PRODUCTS API ============
app.get('/api/products', async (req, res) => {
    try {
        console.log('📦 GET /api/products');
        const { category, search } = req.query;
        
        let query = supabase.from('products').select('*');
        
        if (category) {
            query = query.eq('category', category);
        }
        
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Convert snake_case to camelCase
        const converted = (data || []).map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            category: item.category,
            price: item.price,
            stock: item.stock,
            image: item.image,
            createdAt: item.created_at
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Product not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const newProduct = { ...req.body, created_at: new Date().toISOString() };
        const { data, error } = await supabase.from('products').insert([newProduct]).select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('products').update(req.body).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('products').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
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
        const newOrder = { ...req.body, created_at: new Date().toISOString() };
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

// Serve all frontend files as static assets from public folder with caching
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // Cache CSS, JS, and images for 1 year
        if (filePath.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        // Cache HTML files for 1 hour
        else if (filePath.match(/\.html$/)) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// Serve main page on fallback
app.get('*', (req, res) => {
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
    console.log(`===================================================`);
    console.log(` YAS Laptop Service Server is running online!`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Database: Supabase`);
    console.log(`===================================================`);
  });
}

// Export for Vercel
module.exports = app;

