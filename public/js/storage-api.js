/**
 * YAS Laptop Service Center - API Storage Module
 * Handles all API operations with Supabase backend
 */

class APIStorageManager {
    constructor() {
        // Use Railway backend URL when deployed on Vercel
        this.apiBase = window.location.hostname === 'localhost' ? '/api' : 'https://intelligent-wholeness-production-e0e1.up.railway.app/api';
        this.cache = {
            users: [],
            requests: [],
            products: [],
            orders: [],
            categories: []
        };
        this.loadFromCache();
        this.syncFromServer();
    }

    /**
     * Load data from localStorage cache
     */
    loadFromCache() {
        try {
            this.cache.users = JSON.parse(localStorage.getItem('YAS_users')) || [];
            this.cache.requests = JSON.parse(localStorage.getItem('YAS_requests')) || [];
            this.cache.products = JSON.parse(localStorage.getItem('YAS_products')) || [];
            this.cache.orders = JSON.parse(localStorage.getItem('YAS_orders')) || [];
            this.cache.categories = JSON.parse(localStorage.getItem('YAS_categories')) || [];
        } catch (e) {
            console.warn('Failed to load cache:', e);
        }
    }

    /**
     * Save data to localStorage cache
     */
    saveToCache() {
        try {
            localStorage.setItem('YAS_users', JSON.stringify(this.cache.users));
            localStorage.setItem('YAS_requests', JSON.stringify(this.cache.requests));
            localStorage.setItem('YAS_products', JSON.stringify(this.cache.products));
            localStorage.setItem('YAS_orders', JSON.stringify(this.cache.orders));
            localStorage.setItem('YAS_categories', JSON.stringify(this.cache.categories));
        } catch (e) {
            console.warn('Failed to save cache:', e);
        }
    }

    /**
     * Sync all data from server
     */
    async syncFromServer() {
        try {
            const [users, requests, products, orders, categories] = await Promise.all([
                this.fetchAPI('/users'),
                this.fetchAPI('/requests'),
                this.fetchAPI('/products'),
                this.fetchAPI('/orders'),
                this.fetchAPI('/categories')
            ]);

            this.cache.users = users || [];
            this.cache.requests = requests || [];
            this.cache.products = products || [];
            this.cache.orders = orders || [];
            this.cache.categories = categories || [];

            this.saveToCache();
            console.log('✅ Data synced from server');
        } catch (error) {
            console.warn('⚠️ Failed to sync from server, using cache:', error);
        }
    }

    /**
     * Generic API fetch with error handling
     */
    async fetchAPI(endpoint, options = {}) {
        try {
            const url = `${this.apiBase}${endpoint}`;
            console.log('📡 Fetching API:', url);
            console.log('🌐 API Base:', this.apiBase);
            console.log('📍 Hostname:', window.location.hostname);
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            console.log('📡 API Response status:', response.status);
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API fetch error for ${endpoint}:`, error);
            console.error('❌ API Base:', this.apiBase);
            throw error;
        }
    }

    // ============ USERS ============

    getUsers() {
        return this.cache.users;
    }

    getUserById(id) {
        return this.cache.users.find(u => u.id === id);
    }

    getUserByUsername(username) {
        return this.cache.users.find(u => u.username === username);
    }

    async createUser(userData) {
        try {
            const response = await this.fetchAPI('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.error) throw new Error(response.error);

            const newUser = response.data?.[0] || response;
            this.cache.users.push(newUser);
            this.saveToCache();
            return newUser;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    async updateUser(id, userData) {
        try {
            const response = await this.fetchAPI(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });

            if (response.error) throw new Error(response.error);

            const updatedUser = response.data?.[0] || response;
            const index = this.cache.users.findIndex(u => u.id === id);
            if (index !== -1) {
                this.cache.users[index] = updatedUser;
                this.saveToCache();
            }
            return updatedUser;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            await this.fetchAPI(`/users/${id}`, {
                method: 'DELETE'
            });

            this.cache.users = this.cache.users.filter(u => u.id !== id);
            this.saveToCache();
            return true;
        } catch (error) {
            console.error('Failed to delete user:', error);
            throw error;
        }
    }

    // ============ REQUESTS ============

    getRequests() {
        return this.cache.requests;
    }

    getRequestById(id) {
        return this.cache.requests.find(r => r.id === id);
    }

    getRequestByNumber(number) {
        return this.cache.requests.find(r => r.requestNumber === number);
    }

    getRequestsByPhone(phone) {
        return this.cache.requests.filter(r => r.phone === phone);
    }

    getRequestsByName(name) {
        return this.cache.requests.filter(r => r.name === name);
    }

    async createRequest(requestData) {
        try {
            const response = await this.fetchAPI('/requests', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            if (response.error) throw new Error(response.error);

            const newRequest = response.data?.[0] || response;
            this.cache.requests.unshift(newRequest);
            this.saveToCache();
            return newRequest;
        } catch (error) {
            console.error('Failed to create request:', error);
            throw error;
        }
    }

    async updateRequest(id, requestData) {
        try {
            const response = await this.fetchAPI(`/requests/${id}`, {
                method: 'PUT',
                body: JSON.stringify(requestData)
            });

            if (response.error) throw new Error(response.error);

            const updatedRequest = response.data?.[0] || response;
            const index = this.cache.requests.findIndex(r => r.id === id);
            if (index !== -1) {
                this.cache.requests[index] = updatedRequest;
                this.saveToCache();
            }
            return updatedRequest;
        } catch (error) {
            console.error('Failed to update request:', error);
            throw error;
        }
    }

    async deleteRequest(id) {
        try {
            await this.fetchAPI(`/requests/${id}`, {
                method: 'DELETE'
            });

            this.cache.requests = this.cache.requests.filter(r => r.id !== id);
            this.saveToCache();
            return true;
        } catch (error) {
            console.error('Failed to delete request:', error);
            throw error;
        }
    }

    // ============ PRODUCTS ============

    getProducts() {
        return this.cache.products;
    }

    getProductById(id) {
        return this.cache.products.find(p => p.id === id);
    }

    getCategories() {
        const categories = [...new Set(this.cache.products.map(p => p.category))];
        return categories.length > 0 ? categories : ['لابتوب', 'شاشة', 'رامات', 'هارد', 'بطارية', 'شاحن', 'اكسسوارات', 'أخرى'];
    }

    async createProduct(productData) {
        try {
            const response = await this.fetchAPI('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });

            if (response.error) throw new Error(response.error);

            const newProduct = response.data?.[0] || response;
            this.cache.products.unshift(newProduct);
            this.saveToCache();
            return newProduct;
        } catch (error) {
            console.error('Failed to create product:', error);
            throw error;
        }
    }

    async updateProduct(id, productData) {
        try {
            const response = await this.fetchAPI(`/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });

            if (response.error) throw new Error(response.error);

            const updatedProduct = response.data?.[0] || response;
            const index = this.cache.products.findIndex(p => p.id === id);
            if (index !== -1) {
                this.cache.products[index] = updatedProduct;
                this.saveToCache();
            }
            return updatedProduct;
        } catch (error) {
            console.error('Failed to update product:', error);
            throw error;
        }
    }

    async deleteProduct(id) {
        try {
            await this.fetchAPI(`/products/${id}`, {
                method: 'DELETE'
            });

            this.cache.products = this.cache.products.filter(p => p.id !== id);
            this.saveToCache();
            return true;
        } catch (error) {
            console.error('Failed to delete product:', error);
            throw error;
        }
    }

    // ============ ORDERS ============

    getOrders() {
        return this.cache.orders;
    }

    getOrderById(id) {
        return this.cache.orders.find(o => o.id === id);
    }

    async createOrder(orderData) {
        try {
            const response = await this.fetchAPI('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            if (response.error) throw new Error(response.error);

            const newOrder = response.data?.[0] || response;
            this.cache.orders.unshift(newOrder);
            this.saveToCache();
            return newOrder;
        } catch (error) {
            console.error('Failed to create order:', error);
            throw error;
        }
    }

    async updateOrder(id, orderData) {
        try {
            const response = await this.fetchAPI(`/orders/${id}`, {
                method: 'PUT',
                body: JSON.stringify(orderData)
            });

            if (response.error) throw new Error(response.error);

            const updatedOrder = response.data?.[0] || response;
            const index = this.cache.orders.findIndex(o => o.id === id);
            if (index !== -1) {
                this.cache.orders[index] = updatedOrder;
                this.saveToCache();
            }
            return updatedOrder;
        } catch (error) {
            console.error('Failed to update order:', error);
            throw error;
        }
    }

    // ============ STATS ============

    async getStats() {
        try {
            const response = await this.fetchAPI('/stats');
            return response;
        } catch (error) {
            console.error('Failed to get stats:', error);
            // Return cached stats
            return {
                totalRequests: this.cache.requests.length,
                pendingRequests: this.cache.requests.filter(r => r.status === 'pending').length,
                completedRequests: this.cache.requests.filter(r => r.status === 'completed').length,
                totalProducts: this.cache.products.length,
                totalUsers: this.cache.users.length
            };
        }
    }
}

// Create global instance
const storage = new APIStorageManager();
