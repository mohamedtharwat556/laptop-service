const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Request = require('./models/Request');
const Product = require('./models/Product');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');
let useMongoDB = false;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection (with fallback to JSON)
async function connectDB() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
      useMongoDB = true;
      
      // Seed initial data if empty
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await seedMongoDB();
      }
    } catch (err) {
      console.warn('MongoDB connection failed, falling back to JSON:', err.message);
      useMongoDB = false;
    }
  } else {
    console.log('No MONGODB_URI provided, using JSON file storage');
  }
}

// Seed MongoDB with initial data
async function seedMongoDB() {
  console.log('Seeding MongoDB with initial data...');
  
  await User.create([
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@yas.com'
    },
    {
      username: 'employee',
      password: 'emp123',
      role: 'employee',
      name: 'Customer Service',
      email: 'service@yas.com'
    },
    {
      username: 'technician',
      password: 'tech123',
      role: 'technician',
      name: 'Senior Technician',
      email: 'tech@yas.com'
    }
  ]);
  
  const products = [
    {
      name: 'Dell XPS 15',
      category: 'Laptops',
      price: 1499,
      description: 'High-performance laptop with Intel i7, 16GB RAM, 512GB SSD',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Dell+XPS+15',
      stock: 10
    },
    {
      name: 'HP Pavilion Gaming',
      category: 'Laptops',
      price: 899,
      description: 'Gaming laptop with Ryzen 5, 8GB RAM, 256GB SSD',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=HP+Pavilion',
      stock: 15
    },
    {
      name: '65W Laptop Charger',
      category: 'Chargers',
      price: 45,
      description: 'Universal laptop charger with multiple tips',
      image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Charger',
      stock: 50
    }
  ];
  
  await Product.insertMany(products);
  console.log('MongoDB seeded successfully');
}

// Serve all frontend files as static assets
app.use(express.static(__dirname));

// Helper to read DB
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
    }
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading db.json:', err);
        return {};
    }
}

// Helper to write DB
function writeDB(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing db.json:', err);
    }
}

// ============ API ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all data (legacy support)
app.get('/api/data', async (req, res) => {
    try {
        if (useMongoDB) {
            const [users, requests, products, orders] = await Promise.all([
                User.find({}),
                Request.find({}),
                Product.find({}),
                Order.find({})
            ]);
            res.json({
                users,
                requests,
                products,
                orders,
                categories: products.length > 0 ? [...new Set(products.map(p => p.category))] : []
            });
        } else {
            res.json(readDB());
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Save/merge all data (legacy support)
app.post('/api/data', (req, res) => {
    try {
        const clientData = req.body;
        const currentDB = readDB();
        const updatedDB = { ...currentDB, ...clientData };
        writeDB(updatedDB);
        res.json({ success: true, db: updatedDB });
    } catch (error) {
        console.error('API sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ USERS API ============
app.get('/api/users', async (req, res) => {
    try {
        if (useMongoDB) {
            const users = await User.find({});
            res.json(users);
        } else {
            const db = readDB();
            res.json(db.users || []);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        } else {
            const db = readDB();
            const user = db.users?.find(u => u.id === parseInt(req.params.id));
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        if (useMongoDB) {
            const newUser = await User.create(req.body);
            res.status(201).json(newUser);
        } else {
            const db = readDB();
            const newUser = {
                id: Date.now(),
                ...req.body,
                createdAt: new Date().toISOString()
            };
            db.users = db.users || [];
            db.users.push(newUser);
            writeDB(db);
            res.status(201).json(newUser);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        } else {
            const db = readDB();
            const index = db.users?.findIndex(u => u.id === parseInt(req.params.id));
            if (index === -1 || index === undefined) return res.status(404).json({ error: 'User not found' });
            db.users[index] = { ...db.users[index], ...req.body };
            writeDB(db);
            res.json(db.users[index]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ success: true });
        } else {
            const db = readDB();
            const index = db.users?.findIndex(u => u.id === parseInt(req.params.id));
            if (index === -1 || index === undefined) return res.status(404).json({ error: 'User not found' });
            db.users.splice(index, 1);
            writeDB(db);
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ REQUESTS API ============
app.get('/api/requests', async (req, res) => {
    try {
        if (useMongoDB) {
            const requests = await Request.find({});
            res.json(requests);
        } else {
            const db = readDB();
            res.json(db.requests || []);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/requests/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const request = await Request.findById(req.params.id);
            if (!request) return res.status(404).json({ error: 'Request not found' });
            res.json(request);
        } else {
            const db = readDB();
            const request = db.requests?.find(r => r.id === req.params.id);
            if (!request) return res.status(404).json({ error: 'Request not found' });
            res.json(request);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/requests', async (req, res) => {
    try {
        if (useMongoDB) {
            const newRequest = await Request.create(req.body);
            res.status(201).json(newRequest);
        } else {
            const db = readDB();
            const newRequest = {
                id: req.body.id || `YAS-${String(Date.now()).slice(-6)}`,
                ...req.body,
                createdAt: new Date().toISOString(),
                status: req.body.status || 'pending'
            };
            db.requests = db.requests || [];
            db.requests.push(newRequest);
            writeDB(db);
            res.status(201).json(newRequest);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/requests/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const request = await Request.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!request) return res.status(404).json({ error: 'Request not found' });
            res.json(request);
        } else {
            const db = readDB();
            const index = db.requests?.findIndex(r => r.id === req.params.id);
            if (index === -1 || index === undefined) return res.status(404).json({ error: 'Request not found' });
            db.requests[index] = { ...db.requests[index], ...req.body, updatedAt: new Date().toISOString() };
            writeDB(db);
            res.json(db.requests[index]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/requests/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const request = await Request.findByIdAndDelete(req.params.id);
            if (!request) return res.status(404).json({ error: 'Request not found' });
            res.json({ success: true });
        } else {
            const db = readDB();
            const index = db.requests?.findIndex(r => r.id === req.params.id);
            if (index === -1 || index === undefined) return res.status(404).json({ error: 'Request not found' });
            db.requests.splice(index, 1);
            writeDB(db);
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ PRODUCTS API ============
app.get('/api/products', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        if (useMongoDB) {
            let query = {};
            if (category) query.category = category;
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }
            const products = await Product.find(query);
            res.json(products);
        } else {
            const db = readDB();
            let products = db.products || [];
            
            if (category) {
                products = products.filter(p => p.category === category);
            }
            if (search) {
                products = products.filter(p => 
                    p.name.toLowerCase().includes(search.toLowerCase()) ||
                    p.description.toLowerCase().includes(search.toLowerCase())
                );
            }
            
            res.json(products);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ error: 'Product not found' });
            res.json(product);
        } else {
            const db = readDB();
            const product = db.products?.find(p => p.id === parseInt(req.params.id));
            if (!product) return res.status(404).json({ error: 'Product not found' });
            res.json(product);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        if (useMongoDB) {
            const newProduct = await Product.create(req.body);
            res.status(201).json(newProduct);
        } else {
            const db = readDB();
            const newProduct = {
                id: Date.now(),
                ...req.body,
                createdAt: new Date().toISOString()
            };
            db.products = db.products || [];
            db.products.push(newProduct);
            writeDB(db);
            res.status(201).json(newProduct);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!product) return res.status(404).json({ error: 'Product not found' });
            res.json(product);
        } else {
            const db = readDB();
            const index = db.products?.findIndex(p => p.id === parseInt(req.params.id));
            if (index === -1 || index === undefined) return res.status(404).json({ error: 'Product not found' });
            db.products[index] = { ...db.products[index], ...req.body, updatedAt: new Date().toISOString() };
            writeDB(db);
            res.json(db.products[index]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const product = await Product.findByIdAndDelete(req.params.id);
            if (!product) return res.status(404).json({ error: 'Product not found' });
            res.json({ success: true });
        } else {
            const db = readDB();
            const index = db.products?.findIndex(p => p.id === parseInt(req.params.id));
            if (index === -1 || index === undefined) return res.status(404).json({ error: 'Product not found' });
            db.products.splice(index, 1);
            writeDB(db);
            res.json({ success: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDERS API ============
app.get('/api/orders', async (req, res) => {
    try {
        if (useMongoDB) {
            const orders = await Order.find({});
            res.json(orders);
        } else {
            const db = readDB();
            res.json(db.orders || []);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const order = await Order.findById(req.params.id);
            if (!order) return res.status(404).json({ error: 'Order not found' });
            res.json(order);
        } else {
            const db = readDB();
            const order = db.orders?.find(o => o.id === req.params.id);
            if (!order) return res.status(404).json({ error: 'Order not found' });
            res.json(order);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        if (useMongoDB) {
            const newOrder = await Order.create(req.body);
            res.status(201).json(newOrder);
        } else {
            const db = readDB();
            const newOrder = {
                id: `ORD-${String(Date.now()).slice(-6)}`,
                ...req.body,
                createdAt: new Date().toISOString(),
                status: req.body.status || 'pending'
            };
            db.orders = db.orders || [];
            db.orders.push(newOrder);
            writeDB(db);
            res.status(201).json(newOrder);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        if (useMongoDB) {
            const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!order) return res.status(404).json({ error: 'Order not found' });
            res.json(order);
        } else {
            const db = readDB();
            const index = db.orders?.findIndex(o => o.id === req.params.id);
            if (index === -1 || index === undefined) return res.status(404).json({ error: 'Order not found' });
            db.orders[index] = { ...db.orders[index], ...req.body, updatedAt: new Date().toISOString() };
            writeDB(db);
            res.json(db.orders[index]);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CATEGORIES API ============
app.get('/api/categories', async (req, res) => {
    try {
        if (useMongoDB) {
            const products = await Product.find({}).distinct('category');
            res.json(products);
        } else {
            const db = readDB();
            res.json(db.categories || []);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ CART API ============
app.get('/api/cart', async (req, res) => {
    try {
        if (useMongoDB) {
            // For MongoDB, cart would be stored in a separate collection or user document
            // For now, return empty array as cart is typically client-side
            res.json([]);
        } else {
            const db = readDB();
            res.json(db.cart || []);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/cart', async (req, res) => {
    try {
        if (useMongoDB) {
            // For MongoDB, cart would be stored in a separate collection or user document
            res.json({ success: true, cart: req.body.cart || [] });
        } else {
            const db = readDB();
            db.cart = req.body.cart || [];
            writeDB(db);
            res.json({ success: true, cart: db.cart });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ STATS API ============
app.get('/api/stats', async (req, res) => {
    try {
        if (useMongoDB) {
            const [requests, products, orders, users] = await Promise.all([
                Request.find({}),
                Product.find({}),
                Order.find({}),
                User.find({})
            ]);
            
            const stats = {
                totalRequests: requests.length,
                openRequests: requests.filter(r => 
                    ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
                ).length,
                completedRequests: requests.filter(r => r.status === 'Delivered').length,
                totalProducts: products.length,
                totalOrders: orders.length,
                totalUsers: users.length,
                revenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
            };
            res.json(stats);
        } else {
            const db = readDB();
            const stats = {
                totalRequests: db.requests?.length || 0,
                openRequests: db.requests?.filter(r => r.status === 'pending').length || 0,
                completedRequests: db.requests?.filter(r => r.status === 'completed').length || 0,
                totalProducts: db.products?.length || 0,
                totalOrders: db.orders?.length || 0,
                totalUsers: db.users?.length || 0,
                revenue: db.orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0
            };
            res.json(stats);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve main page on fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server (only when not running on Vercel)
if (process.env.VERCEL) {
  // On Vercel, just connect to DB without listening
  connectDB().catch(err => {
    console.error('Failed to connect to DB:', err);
  });
} else {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(` YAS Laptop Service Server is running online!`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Database: ${useMongoDB ? 'MongoDB' : 'JSON File'}`);
      console.log(`===================================================`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Export for Vercel
module.exports = app;

