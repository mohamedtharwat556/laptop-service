const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock the server
const app = require('../server');

describe('YAS Laptop Service API Tests', () => {
    const DB_FILE = path.join(__dirname, '../db.json');
    let originalDB;

    beforeAll(() => {
        // Backup original DB
        if (fs.existsSync(DB_FILE)) {
            originalDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    });

    afterAll(() => {
        // Restore original DB
        if (originalDB) {
            fs.writeFileSync(DB_FILE, JSON.stringify(originalDB, null, 2));
        }
    });

    describe('Health Check', () => {
        test('GET /api/health should return status ok', async () => {
            const response = await request(app).get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('Users API', () => {
        test('GET /api/users should return users array', async () => {
            const response = await request(app).get('/api/users');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/users should create a new user', async () => {
            const newUser = {
                username: 'testuser',
                password: 'test123',
                role: 'employee',
                name: 'Test User',
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/api/users')
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.username).toBe(newUser.username);
            expect(response.body.email).toBe(newUser.email);
            expect(response.body.id).toBeDefined();
        });

        test('GET /api/users/:id should return a specific user', async () => {
            const response = await request(app).get('/api/users/1');
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(1);
        });

        test('PUT /api/users/:id should update a user', async () => {
            const updateData = { name: 'Updated Name' };
            const response = await request(app)
                .put('/api/users/1')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.name).toBe(updateData.name);
        });
    });

    describe('Products API', () => {
        test('GET /api/products should return products array', async () => {
            const response = await request(app).get('/api/products');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/products with category filter', async () => {
            const response = await request(app)
                .get('/api/products')
                .query({ category: 'Laptops' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('GET /api/products with search query', async () => {
            const response = await request(app)
                .get('/api/products')
                .query({ search: 'Dell' });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/products should create a new product', async () => {
            const newProduct = {
                name: 'Test Product',
                category: 'Test',
                price: 100,
                description: 'Test description',
                image: 'test.jpg',
                stock: 10
            };

            const response = await request(app)
                .post('/api/products')
                .send(newProduct);

            expect(response.status).toBe(201);
            expect(response.body.name).toBe(newProduct.name);
        });
    });

    describe('Requests API', () => {
        test('GET /api/requests should return requests array', async () => {
            const response = await request(app).get('/api/requests');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/requests should create a new request', async () => {
            const newRequest = {
                customerName: 'Test Customer',
                phone: '1234567890',
                laptopBrand: 'Dell',
                laptopModel: 'XPS 15',
                issue: 'Test issue'
            };

            const response = await request(app)
                .post('/api/requests')
                .send(newRequest);

            expect(response.status).toBe(201);
            expect(response.body.customerName).toBe(newRequest.customerName);
            expect(response.body.id).toBeDefined();
        });
    });

    describe('Orders API', () => {
        test('GET /api/orders should return orders array', async () => {
            const response = await request(app).get('/api/orders');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /api/orders should create a new order', async () => {
            const newOrder = {
                customerName: 'Test Customer',
                customerEmail: 'test@example.com',
                customerPhone: '1234567890',
                items: [
                    { name: 'Test Product', price: 100, quantity: 1 }
                ],
                total: 100
            };

            const response = await request(app)
                .post('/api/orders')
                .send(newOrder);

            expect(response.status).toBe(201);
            expect(response.body.customerName).toBe(newOrder.customerName);
            expect(response.body.id).toBeDefined();
        });
    });

    describe('Categories API', () => {
        test('GET /api/categories should return categories array', async () => {
            const response = await request(app).get('/api/categories');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Stats API', () => {
        test('GET /api/stats should return statistics', async () => {
            const response = await request(app).get('/api/stats');
            expect(response.status).toBe(200);
            expect(response.body.totalRequests).toBeDefined();
            expect(response.body.totalProducts).toBeDefined();
            expect(response.body.totalUsers).toBeDefined();
            expect(response.body.revenue).toBeDefined();
        });
    });

    describe('Data API (Legacy)', () => {
        test('GET /api/data should return all data', async () => {
            const response = await request(app).get('/api/data');
            expect(response.status).toBe(200);
            expect(response.body.users).toBeDefined();
            expect(response.body.products).toBeDefined();
            expect(response.body.requests).toBeDefined();
        });

        test('POST /api/data should merge and save data', async () => {
            const testData = {
                testKey: 'testValue'
            };

            const response = await request(app)
                .post('/api/data')
                .send(testData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('GET /api/users/999 should return 404 for non-existent user', async () => {
            const response = await request(app).get('/api/users/999');
            expect(response.status).toBe(404);
            expect(response.body.error).toBeDefined();
        });

        test('GET /api/products/999 should return 404 for non-existent product', async () => {
            const response = await request(app).get('/api/products/999');
            expect(response.status).toBe(404);
            expect(response.body.error).toBeDefined();
        });
    });
});
