const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const supabase = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel
app.set('trust proxy', true);

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

// Initialize Supabase with default data
async function initSupabase() {
  try {
    console.log('Checking Supabase connection...');
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

    // Check if users exist
    const { data: existingUsers, error: usersError } = await supabase.from('users').select('count');
    if (usersError) {
      console.error('Error checking users:', usersError);
      return;
    }

    if (!existingUsers || existingUsers.length === 0) {
      const users = [
        {
          id: 1,
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: 'System Administrator',
          email: 'admin@yas.com',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          username: 'employee',
          password: 'emp123',
          role: 'employee',
          name: 'Customer Service',
          email: 'service@yas.com',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          username: 'technician',
          password: 'tech123',
          role: 'technician',
          name: 'Senior Technician',
          email: 'tech@yas.com',
          created_at: new Date().toISOString()
        }
      ];
      const { error: insertError } = await supabase.from('users').insert(users);
      if (insertError) {
        console.error('Error inserting users:', insertError);
      } else {
        console.log('Users seeded in Supabase');
      }
    }

    // Check if products exist
    const { data: existingProducts, error: productsError } = await supabase.from('products').select('count');
    if (productsError) {
      console.error('Error checking products:', productsError);
      return;
    }

    if (!existingProducts || existingProducts.length === 0) {
      const products = [
        {
          id: 1,
          name: 'Dell XPS 15',
          category: 'Laptops',
          price: 1499,
          description: 'High-performance laptop with Intel i7, 16GB RAM, 512GB SSD',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Dell+XPS+15',
          stock: 10,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'HP Pavilion Gaming',
          category: 'Laptops',
          price: 899,
          description: 'Gaming laptop with Ryzen 5, 8GB RAM, 256GB SSD',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=HP+Pavilion',
          stock: 15,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          name: '65W Laptop Charger',
          category: 'Chargers',
          price: 45,
          description: 'Universal laptop charger with multiple tips',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Charger',
          stock: 50,
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          name: 'Wireless Mouse',
          category: 'Mouse',
          price: 25,
          description: 'Ergonomic wireless mouse with precision tracking',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Mouse',
          stock: 100,
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          name: 'Mechanical Keyboard',
          category: 'Keyboard',
          price: 79,
          description: 'RGB mechanical keyboard with cherry switches',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Keyboard',
          stock: 30,
          created_at: new Date().toISOString()
        },
        {
          id: 6,
          name: '1TB SSD',
          category: 'SSD',
          price: 120,
          description: 'High-speed NVMe SSD for faster performance',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=SSD',
          stock: 40,
          created_at: new Date().toISOString()
        },
        {
          id: 7,
          name: '16GB RAM DDR4',
          category: 'RAM',
          price: 65,
          description: 'High-performance DDR4 RAM module',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=RAM',
          stock: 60,
          created_at: new Date().toISOString()
        },
        {
          id: 8,
          name: 'Laptop Cooling Pad',
          category: 'Cooling Pads',
          price: 35,
          description: 'Dual fan cooling pad for optimal temperature',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Cooling+Pad',
          stock: 45,
          created_at: new Date().toISOString()
        },
        {
          id: 9,
          name: 'Laptop Backpack',
          category: 'Bags',
          price: 55,
          description: 'Water-resistant laptop backpack with padding',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Backpack',
          stock: 25,
          created_at: new Date().toISOString()
        },
        {
          id: 10,
          name: 'USB-C Hub',
          category: 'Accessories',
          price: 40,
          description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card',
          image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=USB-C+Hub',
          stock: 70,
          created_at: new Date().toISOString()
        }
      ];
      const { error: insertError } = await supabase.from('products').insert(products);
      if (insertError) {
        console.error('Error inserting products:', insertError);
      } else {
        console.log('Products seeded in Supabase');
      }
    }

    console.log('Supabase initialization completed successfully');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
  }
}

// Initialize Supabase on startup
initSupabase();

// Simple test endpoint (no middleware)
app.get('/test', (req, res) => {
    res.json({ 
        test: 'working',
        env: {
            SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
        }
    });
});

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all data (legacy support)
app.get('/api/data', async (req, res) => {
    try {
        console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
        console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
        
        const [users, requests, products, orders] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('requests').select('*'),
            supabase.from('products').select('*'),
            supabase.from('orders').select('*')
        ]);

        console.log('Users:', users.data?.length || 0);
        console.log('Products:', products.data?.length || 0);

        res.json({
            users: users.data || [],
            requests: requests.data || [],
            products: products.data || [],
            orders: orders.data || [],
            categories: products.data && products.data.length > 0 ? [...new Set(products.data.map(p => p.category))] : []
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save/merge all data (legacy support)
app.post('/api/data', async (req, res) => {
    try {
        const clientData = req.body;
        // For now, just return success as Supabase handles data differently
        res.json({ success: true });
    } catch (error) {
        console.error('API sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ USERS API ============
app.get('/api/users', async (req, res) => {
    try {
        const { data: users } = await supabase.from('users').select('*');
        res.json(users || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').select('*').eq('id', req.params.id).single();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { data: newUser } = await supabase.from('users').insert(req.body).select().single();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const { data: user } = await supabase.from('users').update(req.body).eq('id', req.params.id).select().single();
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await supabase.from('users').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ REQUESTS API ============
app.get('/api/requests', async (req, res) => {
    try {
        const { data: requests } = await supabase.from('requests').select('*');
        res.json(requests || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/requests/:id', async (req, res) => {
    try {
        const { data: request } = await supabase.from('requests').select('*').eq('id', req.params.id).single();
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/requests', async (req, res) => {
    try {
        const { data: newRequest } = await supabase.from('requests').insert(req.body).select().single();
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/requests/:id', async (req, res) => {
    try {
        const { data: request } = await supabase.from('requests').update(req.body).eq('id', req.params.id).select().single();
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/requests/:id', async (req, res) => {
    try {
        await supabase.from('requests').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PRODUCTS API ============
app.get('/api/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = supabase.from('products').select('*');
        
        if (category) {
            query = query.eq('category', category);
        }
        
        const { data: products } = await query;
        
        let filteredProducts = products || [];
        if (search) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        res.json(filteredProducts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const { data: product } = await supabase.from('products').select('*').eq('id', req.params.id).single();
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { data: newProduct } = await supabase.from('products').insert(req.body).select().single();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { data: product } = await supabase.from('products').update(req.body).eq('id', req.params.id).select().single();
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await supabase.from('products').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDERS API ============
app.get('/api/orders', async (req, res) => {
    try {
        const { data: orders } = await supabase.from('orders').select('*');
        res.json(orders || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const { data: order } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { data: newOrder } = await supabase.from('orders').insert(req.body).select().single();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        const { data: order } = await supabase.from('orders').update(req.body).eq('id', req.params.id).select().single();
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CATEGORIES API ============
app.get('/api/categories', async (req, res) => {
    try {
        const { data: products } = await supabase.from('products').select('category');
        const categories = [...new Set(products?.map(p => p.category) || [])];
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CART API ============
app.get('/api/cart', async (req, res) => {
    try {
        const { data: cart } = await supabase.from('cart').select('*');
        res.json(cart || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cart', async (req, res) => {
    try {
        const { cart } = req.body;
        // Clear existing cart and insert new items
        await supabase.from('cart').delete().neq('id', 0);
        if (cart && cart.length > 0) {
            await supabase.from('cart').insert(cart);
        }
        res.json({ success: true, cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ STATS API ============
app.get('/api/stats', async (req, res) => {
    try {
        const [requests, products, orders, users] = await Promise.all([
            supabase.from('requests').select('*'),
            supabase.from('products').select('*'),
            supabase.from('orders').select('*'),
            supabase.from('users').select('*')
        ]);
        
        const stats = {
            totalRequests: requests.data.length,
            openRequests: requests.data.filter(r => 
                ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
            ).length,
            completedRequests: requests.data.filter(r => r.status === 'Delivered').length,
            totalProducts: products.data.length,
            totalOrders: orders.data.length,
            totalUsers: users.data.length,
            revenue: orders.data.reduce((sum, o) => sum + (o.total || 0), 0)
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve all frontend files as static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve main page on fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
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

