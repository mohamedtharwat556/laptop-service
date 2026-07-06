/**
 * YAS Laptop Service Center - Storage Module
 * Handles all LocalStorage operations for the application
 */

class StorageManager {
    constructor() {
        this.prefix = 'YAS_';
        this.syncFromServerAsync().catch(err => console.warn('Initial sync failed:', err));
        this.initializeData();
        this.startAutoSync();
    }

    async syncFromServerAsync() {
        try {
            const response = await fetch('/api/data');
            if (response.ok) {
                const db = await response.json();
                // Clear existing YAS_ keys and populate from server
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                });
                Object.keys(db).forEach(key => {
                    localStorage.setItem(this.prefix + key, JSON.stringify(db[key]));
                });
            }
        } catch (e) {
            console.warn('Backend not running or offline, using LocalStorage cache.', e);
        }
    }

    syncToServerAsync(key, value) {
        try {
            const payload = {};
            payload[key] = value;
            fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error('Failed to sync to server:', err));
        } catch (e) {
            console.error(e);
        }
    }

    startAutoSync() {
        // Poll every 10 seconds to get updates from other clients
        setInterval(() => {
            fetch('/api/data')
                .then(res => res.json())
                .then(db => {
                    Object.keys(db).forEach(key => {
                        const localVal = localStorage.getItem(this.prefix + key);
                        const serverValStr = JSON.stringify(db[key]);
                        if (localVal !== serverValStr) {
                            localStorage.setItem(this.prefix + key, serverValStr);
                            // Trigger storage event so other open tabs/scripts can refresh if they listen to it
                            window.dispatchEvent(new Event('storage'));
                        }
                    });
                })
                .catch(err => console.warn('Auto-sync failed:', err));
        }, 10000);
    }

    /**
     * Initialize default data if not present
     */
    initializeData() {
        // Initialize users
        if (!this.get('users')) {
            const defaultUsers = [
                {
                    id: 1,
                    username: 'admin',
                    password: 'admin123',
                    role: 'admin',
                    name: 'System Administrator',
                    email: 'admin@yas.com',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    username: 'employee',
                    password: 'emp123',
                    role: 'employee',
                    name: 'Customer Service',
                    email: 'service@yas.com',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    username: 'technician',
                    password: 'tech123',
                    role: 'technician',
                    name: 'Senior Technician',
                    email: 'tech@yas.com',
                    createdAt: new Date().toISOString()
                }
            ];
            this.set('users', defaultUsers);
        }

        // Initialize maintenance requests
        if (!this.get('requests')) {
            this.set('requests', []);
        }

        // Initialize products
        if (!this.get('products')) {
            const defaultProducts = [
                {
                    id: 1,
                    name: 'Dell XPS 15',
                    category: 'Laptops',
                    price: 1499,
                    description: 'High-performance laptop with Intel i7, 16GB RAM, 512GB SSD',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Dell+XPS+15',
                    stock: 10
                },
                {
                    id: 2,
                    name: 'HP Pavilion Gaming',
                    category: 'Laptops',
                    price: 899,
                    description: 'Gaming laptop with Ryzen 5, 8GB RAM, 256GB SSD',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=HP+Pavilion',
                    stock: 15
                },
                {
                    id: 3,
                    name: '65W Laptop Charger',
                    category: 'Chargers',
                    price: 45,
                    description: 'Universal laptop charger with multiple tips',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Charger',
                    stock: 50
                },
                {
                    id: 4,
                    name: 'Wireless Mouse',
                    category: 'Mouse',
                    price: 25,
                    description: 'Ergonomic wireless mouse with precision tracking',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Mouse',
                    stock: 100
                },
                {
                    id: 5,
                    name: 'Mechanical Keyboard',
                    category: 'Keyboard',
                    price: 79,
                    description: 'RGB mechanical keyboard with cherry switches',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Keyboard',
                    stock: 30
                },
                {
                    id: 6,
                    name: '1TB SSD',
                    category: 'SSD',
                    price: 120,
                    description: 'High-speed NVMe SSD for faster performance',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=SSD',
                    stock: 40
                },
                {
                    id: 7,
                    name: '16GB RAM DDR4',
                    category: 'RAM',
                    price: 65,
                    description: 'High-performance DDR4 RAM module',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=RAM',
                    stock: 60
                },
                {
                    id: 8,
                    name: 'Laptop Cooling Pad',
                    category: 'Cooling Pads',
                    price: 35,
                    description: 'Dual fan cooling pad for optimal temperature',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Cooling+Pad',
                    stock: 45
                },
                {
                    id: 9,
                    name: 'Laptop Backpack',
                    category: 'Bags',
                    price: 55,
                    description: 'Water-resistant laptop backpack with padding',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=Backpack',
                    stock: 25
                },
                {
                    id: 10,
                    name: 'USB-C Hub',
                    category: 'Accessories',
                    price: 40,
                    description: '7-in-1 USB-C hub with HDMI, USB 3.0, SD card',
                    image: 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=USB-C+Hub',
                    stock: 70
                }
            ];
            this.set('products', defaultProducts);
        }

        // Initialize orders
        if (!this.get('orders')) {
            this.set('orders', []);
        }

        // Initialize cart
        if (!this.get('cart')) {
            this.set('cart', []);
        }

        // Initialize categories
        if (!this.get('categories')) {
            const defaultCategories = [
                'Laptops',
                'Accessories',
                'Chargers',
                'Mouse',
                'Keyboard',
                'SSD',
                'RAM',
                'Cooling Pads',
                'Bags'
            ];
            this.set('categories', defaultCategories);
        }
    }

    /**
     * Get data from LocalStorage
     */
    get(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting data from storage:', error);
            return null;
        }
    }

    /**
     * Set data to LocalStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            this.syncToServerAsync(key, value);
            return true;
        } catch (error) {
            console.error('Error setting data to storage:', error);
            return false;
        }
    }

    /**
     * Remove data from LocalStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            this.syncToServerAsync(key, null);
            return true;
        } catch (error) {
            console.error('Error removing data from storage:', error);
            return false;
        }
    }

    /**
     * Clear all application data
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Generate request number
     */
    generateRequestNumber() {
        const requests = this.get('requests') || [];
        const nextNumber = requests.length + 1;
        return 'YAS-' + String(nextNumber).padStart(6, '0');
    }

    /**
     * Generate order number
     */
    generateOrderNumber() {
        const orders = this.get('orders') || [];
        const nextNumber = orders.length + 1;
        return 'ORD-' + String(nextNumber).padStart(6, '0');
    }

    // User Operations
    getUsers() {
        return this.get('users') || [];
    }

    getUserById(id) {
        const users = this.getUsers();
        return users.find(user => user.id === id);
    }

    getUserByUsername(username) {
        const users = this.getUsers();
        return users.find(user => user.username === username);
    }

    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: parseInt(this.generateId(), 36),
            ...userData,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        this.set('users', users);
        return newUser;
    }

    updateUser(id, userData) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            this.set('users', users);
            return users[index];
        }
        return null;
    }

    deleteUser(id) {
        const users = this.getUsers();
        const filteredUsers = users.filter(user => user.id !== id);
        this.set('users', filteredUsers);
        return filteredUsers.length < users.length;
    }

    // Request Operations
    getRequests() {
        return this.get('requests') || [];
    }

    getRequestById(id) {
        const requests = this.getRequests();
        return requests.find(request => request.id === id);
    }

    getRequestByNumber(requestNumber) {
        const requests = this.getRequests();
        return requests.find(request => request.requestNumber === requestNumber);
    }

    getRequestsByPhone(phone) {
        const requests = this.getRequests();
        return requests.filter(request => request.phone === phone);
    }

    async createRequest(requestData) {
        try {
            // Send to server API first (MongoDB)
            const response = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...requestData,
                    status: 'Received'
                })
            });
            
            if (response.ok) {
                const newRequest = await response.json();
                // Also save to localStorage for offline support
                const requests = this.getRequests();
                requests.push(newRequest);
                this.set('requests', requests);
                return newRequest;
            } else {
                // Fallback to localStorage if server fails
                const requests = this.getRequests();
                const newRequest = {
                    id: parseInt(this.generateId(), 36),
                    requestNumber: this.generateRequestNumber(),
                    ...requestData,
                    status: 'Received',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                requests.push(newRequest);
                this.set('requests', requests);
                return newRequest;
            }
        } catch (error) {
            console.error('Failed to create request on server, using localStorage:', error);
            // Fallback to localStorage
            const requests = this.getRequests();
            const newRequest = {
                id: parseInt(this.generateId(), 36),
                requestNumber: this.generateRequestNumber(),
                ...requestData,
                status: 'Received',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            requests.push(newRequest);
            this.set('requests', requests);
            return newRequest;
        }
    }

    updateRequest(id, requestData) {
        const requests = this.getRequests();
        const index = requests.findIndex(request => request.id === id);
        if (index !== -1) {
            requests[index] = { 
                ...requests[index], 
                ...requestData,
                updatedAt: new Date().toISOString()
            };
            this.set('requests', requests);
            return requests[index];
        }
        return null;
    }

    deleteRequest(id) {
        const requests = this.getRequests();
        const filteredRequests = requests.filter(request => request.id !== id);
        this.set('requests', filteredRequests);
        return filteredRequests.length < requests.length;
    }

    // Product Operations
    getProducts() {
        return this.get('products') || [];
    }

    getProductById(id) {
        const products = this.getProducts();
        return products.find(product => product.id === id);
    }

    getProductsByCategory(category) {
        const products = this.getProducts();
        return products.filter(product => product.category === category);
    }

    createProduct(productData) {
        const products = this.getProducts();
        const newProduct = {
            id: parseInt(this.generateId(), 36),
            ...productData,
            createdAt: new Date().toISOString()
        };
        products.push(newProduct);
        this.set('products', products);
        return newProduct;
    }

    updateProduct(id, productData) {
        const products = this.getProducts();
        const index = products.findIndex(product => product.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
            this.set('products', products);
            return products[index];
        }
        return null;
    }

    deleteProduct(id) {
        const products = this.getProducts();
        const filteredProducts = products.filter(product => product.id !== id);
        this.set('products', filteredProducts);
        return filteredProducts.length < products.length;
    }

    // Order Operations
    getOrders() {
        return this.get('orders') || [];
    }

    getOrderById(id) {
        const orders = this.getOrders();
        return orders.find(order => order.id === id);
    }

    getOrdersByNumber(orderNumber) {
        const orders = this.getOrders();
        return orders.find(order => order.orderNumber === orderNumber);
    }

    createOrder(orderData) {
        const orders = this.getOrders();
        const newOrder = {
            id: parseInt(this.generateId(), 36),
            orderNumber: this.generateOrderNumber(),
            ...orderData,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };
        orders.push(newOrder);
        this.set('orders', orders);
        return newOrder;
    }

    updateOrder(id, orderData) {
        const orders = this.getOrders();
        const index = orders.findIndex(order => order.id === id);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...orderData };
            this.set('orders', orders);
            return orders[index];
        }
        return null;
    }

    deleteOrder(id) {
        const orders = this.getOrders();
        const filteredOrders = orders.filter(order => order.id !== id);
        this.set('orders', filteredOrders);
        return filteredOrders.length < orders.length;
    }

    // Cart Operations
    getCart() {
        return this.get('cart') || [];
    }

    addToCart(product, quantity = 1) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.productId === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        this.set('cart', cart);
        return cart;
    }

    updateCartItem(productId, quantity) {
        const cart = this.getCart();
        const index = cart.findIndex(item => item.productId === productId);
        
        if (index !== -1) {
            if (quantity <= 0) {
                cart.splice(index, 1);
            } else {
                cart[index].quantity = quantity;
            }
            this.set('cart', cart);
        }
        
        return cart;
    }

    removeFromCart(productId) {
        const cart = this.getCart();
        const filteredCart = cart.filter(item => item.productId !== productId);
        this.set('cart', filteredCart);
        return filteredCart;
    }

    clearCart() {
        this.set('cart', []);
        return [];
    }

    // Category Operations
    getCategories() {
        return this.get('categories') || [];
    }

    addCategory(category) {
        const categories = this.getCategories();
        if (!categories.includes(category)) {
            categories.push(category);
            this.set('categories', categories);
        }
        return categories;
    }

    removeCategory(category) {
        const categories = this.getCategories();
        const filteredCategories = categories.filter(cat => cat !== category);
        this.set('categories', filteredCategories);
        return filteredCategories;
    }

    // Statistics
    getStatistics() {
        const requests = this.getRequests();
        const orders = this.getOrders();
        const products = this.getProducts();

        const today = new Date().toDateString();
        const todayOrders = orders.filter(order => 
            new Date(order.createdAt).toDateString() === today
        );

        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        return {
            totalRequests: requests.length,
            openRequests: requests.filter(r => 
                ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
            ).length,
            completedRequests: requests.filter(r => r.status === 'Delivered').length,
            todayOrders: todayOrders.length,
            totalRevenue: totalRevenue,
            totalProducts: products.length,
            totalOrders: orders.length
        };
    }
}

// Create global instance
const storage = new StorageManager();
