/**
 * YAS Laptop Service Center - Admin Module
 * Handles admin dashboard with Chart.js statistics and user management
 */

class AdminManager {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.users = [];
        this.requests = [];
        this.orders = [];
        this.products = [];
        this.charts = {};
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.autoRefreshInterval = null;
    }

    /**
     * Initialize admin dashboard
     */
    async init() {
        await this.loadData();
        await this.switchSection('dashboard');
        this.startAutoRefresh();
    }

    /**
     * Start auto-refresh every 10 seconds
     */
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        this.autoRefreshInterval = setInterval(async () => {
            await this.loadData();
            if (this.currentSection === 'dashboard') {
                this.renderStats();
                this.renderCharts();
            } else if (this.currentSection === 'requests') {
                this.renderRequests();
            } else if (this.currentSection === 'users') {
                this.renderUsers();
            } else if (this.currentSection === 'products') {
                this.renderProductsManagement();
            }
        }, 10000);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const user = sessionStorage.getItem('YAS_currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            return this.currentUser.role === 'admin';
        }
        return false;
    }

    /**
     * Login
     */
    async login(username, password) {
        const user = storage.getUserByUsername(username);
        
        if (user && user.password === password && user.role === 'admin') {
            this.currentUser = user;
            sessionStorage.setItem('YAS_currentUser', JSON.stringify(user));
            return true;
        }
        
        return false;
    }

    /**
     * Logout
     */
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('YAS_currentUser');
        window.location.href = 'index.html';
    }

    /**
     * Load data from API
     */
    async loadData() {
        try {
            const [users, requests, orders, products] = await Promise.all([
                fetch('/api/users').then(r => r.json()),
                fetch('/api/requests').then(r => r.json()),
                fetch('/api/orders').then(r => r.json()),
                fetch('/api/products').then(r => r.json())
            ]);
            this.users = users;
            this.requests = requests;
            this.orders = orders;
            this.products = products;
        } catch (error) {
            console.error('Failed to load data from API:', error);
            // Fallback to localStorage
            this.users = storage.getUsers();
            this.requests = storage.getRequests();
            this.orders = storage.getOrders();
            this.products = storage.getProducts();
        }
    }

    /**
     * Render dashboard statistics
     */
    renderStats() {
        const stats = this.calculateStatistics();
        
        const statsContainer = document.getElementById('adminStats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.openStatFilter('requests','All')" title="عرض جميع الطلبات">
                    <div class="stat-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.totalRequests}</h3>
                        <p>إجمالي الطلبات</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.openStatFilter('requests','open')" title="عرض الطلبات المفتوحة">
                    <div class="stat-icon warning">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.openRequests}</h3>
                        <p>طلبات مفتوحة</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.openStatFilter('requests','Delivered')" title="عرض الطلبات المكتملة">
                    <div class="stat-icon success">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.completedRequests}</h3>
                        <p>مكتملة</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.openStatFilter('requests','today')" title="عرض طلبات اليوم">
                    <div class="stat-icon">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.todayOrders}</h3>
                        <p>طلبات اليوم</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.openStatFilter('requests','All')" title="عرض الإيرادات">
                    <div class="stat-icon success">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${Utils.formatCurrency(stats.totalRevenue)}</h3>
                        <p>إجمالي الإيرادات</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.openStatFilter('users','All')" title="عرض المستخدمين">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${this.users.length}</h3>
                        <p>إجمالي المستخدمين</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
            </div>
        `;
    }

    /**
     * Calculate statistics from loaded data
     */
    calculateStatistics() {
        const today = new Date().toDateString();
        const todayOrders = this.orders.filter(order => 
            new Date(order.createdAt).toDateString() === today
        );

        const totalRevenue = this.orders.reduce((sum, order) => sum + (order.total || 0), 0);

        return {
            totalRequests: this.requests.length,
            openRequests: this.requests.filter(r => 
                ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
            ).length,
            completedRequests: this.requests.filter(r => r.status === 'Delivered').length,
            todayOrders: todayOrders.length,
            totalRevenue: totalRevenue,
            totalProducts: this.products.length,
            totalOrders: this.orders.length
        };
    }

    /**
     * Render charts
     */
    renderCharts() {
        this.destroyCharts();
        this.renderRequestsChart();
        this.renderRevenueChart();
        this.renderProductsChart();
    }

    /**
     * Destroy existing charts
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }

    /**
     * Render requests chart
     */
    renderRequestsChart() {
        const ctx = document.getElementById('requestsChart');
        if (!ctx) return;

        const statusCounts = {
            'Received': 0,
            'Waiting Inspection': 0,
            'Under Maintenance': 0,
            'Waiting Parts': 0,
            'Ready': 0,
            'Delivered': 0
        };

        this.requests.forEach(r => {
            if (statusCounts.hasOwnProperty(r.status)) {
                statusCounts[r.status]++;
            }
        });

        this.charts.requests = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: [
                        '#3b82f6',
                        '#f59e0b',
                        '#8b5cf6',
                        '#ec4899',
                        '#10b981',
                        '#22c55e'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    /**
     * Render revenue chart
     */
    renderRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Get last 7 days of orders
        const last7Days = [];
        const revenueData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
            
            const dayRevenue = this.orders
                .filter(o => new Date(o.createdAt).toDateString() === dateStr)
                .reduce((sum, o) => sum + (o.total || 0), 0);
            
            revenueData.push(dayRevenue);
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render products chart
     */
    renderProductsChart() {
        const ctx = document.getElementById('productsChart');
        if (!ctx) return;

        const categoryCounts = {};
        storage.getCategories().forEach(cat => categoryCounts[cat] = 0);
        
        this.products.forEach(p => {
            if (categoryCounts.hasOwnProperty(p.category)) {
                categoryCounts[p.category]++;
            }
        });

        this.charts.products = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(categoryCounts),
                datasets: [{
                    label: 'Products',
                    data: Object.values(categoryCounts),
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6',
                        '#ec4899',
                        '#06b6d4',
                        '#84cc16',
                        '#f97316'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    /**
     * Render users management
     */
    renderUsers() {
        const container = document.getElementById('usersContainer');
        if (!container) return;

        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Users Found</h3>
                    <p>There are no users in the system.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                <button class="btn btn-primary" onclick="adminManager.showAddUserModal()">
                    <i class="fas fa-plus"></i> Add User
                </button>
            </div>
            <div style="display: grid; gap: 1rem;">
                ${this.users.map(user => `
                    <div class="glass-card user-card">
                        <div class="user-card-header">
                            <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                            <div class="user-info">
                                <h4>${user.name}</h4>
                                <p>${user.email || user.username}</p>
                            </div>
                            <span class="user-role user-role-${user.role}">${user.role}</span>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-primary" onclick="adminManager.editUser(${user.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            ${user.id !== this.currentUser.id ? `
                                <button class="btn btn-danger" onclick="adminManager.deleteUser(${user.id})">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Show add user modal
     */
    showAddUserModal() {
        const content = `
            <form id="addUserForm">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" name="username" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" name="password" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email">
                </div>
                <div class="form-group">
                    <label class="form-label">Role</label>
                    <select class="form-select" name="role">
                        <option value="employee">Employee</option>
                        <option value="technician">Technician</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-plus"></i> Add User
                </button>
            </form>
        `;

        modalManager.create('add-user', 'Add New User', content);
        modalManager.open('add-user');

        const form = document.getElementById('addUserForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userData = {
                name: form.name.value,
                username: form.username.value,
                password: form.password.value,
                email: form.email.value,
                role: form.role.value
            };

            storage.createUser(userData);
            this.loadData();
            this.renderUsers();
            modalManager.close('add-user');
            toast.success('User added successfully');
        });
    }

    /**
     * Edit user
     */
    editUser(userId) {
        const user = storage.getUserById(userId);
        if (!user) return;

        const content = `
            <form id="editUserForm">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" name="name" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" name="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Password (leave blank to keep current)</label>
                    <input type="password" class="form-input" name="password">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" value="${user.email || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Role</label>
                    <select class="form-select" name="role">
                        <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>Employee</option>
                        <option value="technician" ${user.role === 'technician' ? 'selected' : ''}>Technician</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </form>
        `;

        modalManager.create('edit-user', 'Edit User', content);
        modalManager.open('edit-user');

        const form = document.getElementById('editUserForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userData = {
                name: form.name.value,
                username: form.username.value,
                email: form.email.value,
                role: form.role.value
            };

            if (form.password.value) {
                userData.password = form.password.value;
            }

            storage.updateUser(userId, userData);
            this.loadData();
            this.renderUsers();
            modalManager.close('edit-user');
            toast.success('User updated successfully');
        });
    }

    /**
     * Delete user
     */
    deleteUser(userId) {
        if (userId === this.currentUser.id) {
            toast.error('You cannot delete your own account');
            return;
        }

        const content = `
            <div>
                <p style="margin-bottom: 1rem;">Are you sure you want to delete this user? This action cannot be undone.</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="modalManager.close('delete-user')">Cancel</button>
                    <button class="btn btn-danger" onclick="adminManager.confirmDeleteUser(${userId})">Delete</button>
                </div>
            </div>
        `;

        modalManager.create('delete-user', 'Delete User', content);
        modalManager.open('delete-user');
    }

    /**
     * Confirm delete user
     */
    confirmDeleteUser(userId) {
        storage.deleteUser(userId);
        this.loadData();
        this.renderUsers();
        modalManager.close('delete-user');
        toast.success('User deleted successfully');
    }

    /**
     * Render products management
     */
    renderProductsManagement() {
        const container = document.getElementById('productsManagementContainer');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box"></i>
                    <h3>No Products Found</h3>
                    <p>There are no products in the system.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                <button class="btn btn-primary" onclick="adminManager.showAddProductModal()">
                    <i class="fas fa-plus"></i> Add Product
                </button>
            </div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.products.map(product => `
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <img src="${product.image}" alt="${product.name}" 
                                             style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                                        <span>${product.name}</span>
                                    </div>
                                </td>
                                <td>${product.category}</td>
                                <td>${Utils.formatCurrency(product.price)}</td>
                                <td>${product.stock}</td>
                                <td>
                                    <button class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                            onclick="adminManager.editProduct(${product.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                            onclick="adminManager.deleteProduct(${product.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Show add product modal
     */
    showAddProductModal() {
        const content = `
            <form id="addProductForm">
                <div class="form-group">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-input" name="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" name="category">
                        ${storage.getCategories().map(cat => `
                            <option value="${cat}">${cat}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Price ($)</label>
                    <input type="number" class="form-input" name="price" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Stock</label>
                    <input type="number" class="form-input" name="stock" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Image URL</label>
                    <input type="url" class="form-input" name="image" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" name="description" rows="3" required></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-plus"></i> Add Product
                </button>
            </form>
        `;

        modalManager.create('add-product', 'Add New Product', content);
        modalManager.open('add-product');

        const form = document.getElementById('addProductForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const productData = {
                name: form.name.value,
                category: form.category.value,
                price: parseFloat(form.price.value),
                stock: parseInt(form.stock.value),
                image: form.image.value || 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=No+Image',
                description: form.description.value
            };

            storage.createProduct(productData);
            this.loadData();
            this.renderProductsManagement();
            this.renderCharts();
            modalManager.close('add-product');
            toast.success('Product added successfully');
        });
    }

    /**
     * Edit product
     */
    editProduct(productId) {
        const product = storage.getProductById(productId);
        if (!product) return;

        const content = `
            <form id="editProductForm">
                <div class="form-group">
                    <label class="form-label">Product Name</label>
                    <input type="text" class="form-input" name="name" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" name="category">
                        ${storage.getCategories().map(cat => `
                            <option value="${cat}" ${product.category === cat ? 'selected' : ''}>${cat}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Price ($)</label>
                    <input type="number" class="form-input" name="price" value="${product.price}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Stock</label>
                    <input type="number" class="form-input" name="stock" value="${product.stock}" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Image URL</label>
                    <input type="url" class="form-input" name="image" value="${product.image}">
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" name="description" rows="3" required>${product.description}</textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </form>
        `;

        modalManager.create('edit-product', 'Edit Product', content);
        modalManager.open('edit-product');

        const form = document.getElementById('editProductForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const productData = {
                name: form.name.value,
                category: form.category.value,
                price: parseFloat(form.price.value),
                stock: parseInt(form.stock.value),
                image: form.image.value,
                description: form.description.value
            };

            storage.updateProduct(productId, productData);
            this.loadData();
            this.renderProductsManagement();
            this.renderCharts();
            modalManager.close('edit-product');
            toast.success('Product updated successfully');
        });
    }

    /**
     * Delete product
     */
    deleteProduct(productId) {
        const content = `
            <div>
                <p style="margin-bottom: 1rem;">Are you sure you want to delete this product? This action cannot be undone.</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="modalManager.close('delete-product')">Cancel</button>
                    <button class="btn btn-danger" onclick="adminManager.confirmDeleteProduct(${productId})">Delete</button>
                </div>
            </div>
        `;

        modalManager.create('delete-product', 'Delete Product', content);
        modalManager.open('delete-product');
    }

    /**
     * Confirm delete product
     */
    confirmDeleteProduct(productId) {
        storage.deleteProduct(productId);
        this.loadData();
        this.renderProductsManagement();
        this.renderCharts();
        modalManager.close('delete-product');
        toast.success('Product deleted successfully');
    }

    /**
     * Switch section
     */
    async switchSection(section) {
        this.currentSection = section;
        
        // Update sidebar
        document.querySelectorAll('.sidebar-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === section) {
                link.classList.add('active');
            }
        });

        // Update content
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
            if (sec.id === `${section}Section`) {
                sec.classList.add('active');
            }
        });

        // Load fresh data from API
        await this.loadData();

        // Render section content
        switch (section) {
            case 'dashboard':
                this.renderStats();
                this.renderCharts();
                break;
            case 'requests':
                this.renderRequests();
                break;
            case 'users':
                this.renderUsers();
                break;
            case 'products':
                this.renderProductsManagement();
                break;
        }
    }

    /**
     * Render requests table
     */
    renderRequests() {
        const container = document.getElementById('requestsContainer');
        if (!container) return;

        const filteredRequests = this.filterRequests();
        const { data, pages } = this.paginate(filteredRequests);

        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No Requests Found</h3>
                    <p>There are no maintenance requests to display.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Request #</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Device</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(request => `
                            <tr>
                                <td><strong>${request.requestNumber}</strong></td>
                                <td>${request.fullName}</td>
                                <td>${request.phone}</td>
                                <td>${request.laptopBrand} ${request.laptopModel}</td>
                                <td><span class="status-badge ${this.getStatusClass(request.status)}">${this.translateStatus(request.status)}</span></td>
                                <td>${request.priority}</td>
                                <td>${Utils.formatDate(request.createdAt)}</td>
                                <td>
                                    <button class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                            onclick="adminManager.viewRequest(${request.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="requestsPagination"></div>
        `;

        this.renderPagination('requestsPagination', pages);
    }

    /**
     * Filter requests
     */
    filterRequests() {
        let filtered = [...this.requests];
        const searchTerm = document.getElementById('requestSearch')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || 'All';

        if (searchTerm) {
            // reset special filter on manual search
            this._specialFilter = null;
            filtered = filtered.filter(r => 
                r.requestNumber.toLowerCase().includes(searchTerm) ||
                r.fullName.toLowerCase().includes(searchTerm) ||
                r.phone.includes(searchTerm)
            );
        }

        const activeFilter = this._specialFilter || statusFilter;

        if (activeFilter === 'today') {
            const today = new Date().toDateString();
            filtered = filtered.filter(r => new Date(r.createdAt).toDateString() === today);
        } else if (activeFilter === 'open') {
            filtered = filtered.filter(r => r.status !== 'Delivered');
        } else if (activeFilter !== 'All') {
            filtered = filtered.filter(r => r.status === activeFilter);
        }
        return filtered;
    }

    paginate(data) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return { data: data.slice(start, end), pages: Math.ceil(data.length / this.itemsPerPage) };
    }

    renderPagination(containerId, totalPages) {
        const container = document.getElementById(containerId);
        if (!container || totalPages <= 1) {
            if (container) container.innerHTML = '';
            return;
        }
        let html = '<div class="pagination">';
        html += `<button ${this.currentPage === 1 ? 'disabled' : ''} onclick="adminManager.goToPage(${this.currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="adminManager.goToPage(${i})">${i}</button>`;
        }
        html += `<button ${this.currentPage === totalPages ? 'disabled' : ''} onclick="adminManager.goToPage(${this.currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
        html += '</div>';
        container.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderRequests();
    }

    /**
     * Navigate from stat card to relevant section with optional filter
     */
    openStatFilter(section, filter) {
        this.currentPage = 1;
        this.switchSection(section);

        if (section === 'requests') {
            // Wait for DOM to render then set the filter
            setTimeout(() => {
                const statusFilter = document.getElementById('statusFilter');
                if (statusFilter) {
                    // Map special filters to select values
                    if (filter === 'open' || filter === 'today') {
                        statusFilter.value = 'All'; // will be handled by filterRequests
                    } else {
                        statusFilter.value = filter;
                    }
                    // Store special filter
                    this._specialFilter = (filter === 'open' || filter === 'today') ? filter : null;
                    this.renderRequests();
                }
            }, 50);
        }
    }

    viewRequest(requestId) {
        const request = storage.getRequestById(requestId);
        if (!request) return;

        const content = `
            <div style="max-height: 70vh; overflow-y: auto;">
                <div class="request-card-header">
                    <div>
                        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${request.requestNumber}</h3>
                        <span class="status-badge ${this.getStatusClass(request.status)}">${this.translateStatus(request.status)}</span>
                    </div>
                </div>
                <div class="request-details">
                    <div class="request-detail-item"><span class="request-detail-label">اسم العميل</span><span class="request-detail-value">${request.fullName}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">رقم الهاتف</span><span class="request-detail-value">${request.phone}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">الجهاز</span><span class="request-detail-value">${request.laptopBrand}${request.laptopModel ? ' ' + request.laptopModel : ''}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">المشكلة</span><span class="request-detail-value">${request.problemDescription}</span></div>
                </div>
                <form id="editRequestForm" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label class="form-label">رد الإدارة</label>
                        <textarea class="form-textarea" name="adminReply" rows="3">${request.adminReply || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">تاريخ ووقت الاستلام المتوقع</label>
                        <input type="datetime-local" class="form-input" name="estimatedCompletionDate" value="${request.estimatedCompletionDate || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">تحديث الحالة</label>
                        <select class="form-select" name="status">
                            <option value="Received" ${request.status === 'Received' ? 'selected' : ''}>تم الاستلام</option>
                            <option value="Waiting Inspection" ${request.status === 'Waiting Inspection' ? 'selected' : ''}>بانتظار الفحص</option>
                            <option value="Under Maintenance" ${request.status === 'Under Maintenance' ? 'selected' : ''}>قيد الصيانة</option>
                            <option value="Waiting Parts" ${request.status === 'Waiting Parts' ? 'selected' : ''}>بانتظار قطع الغيار</option>
                            <option value="Ready" ${request.status === 'Ready' ? 'selected' : ''}>جاهز للتسليم</option>
                            <option value="Delivered" ${request.status === 'Delivered' ? 'selected' : ''}>تم التسليم للعميل</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ التغييرات</button>
                </form>
            </div>
        `;
        modalManager.create('view-request', 'تفاصيل الطلب', content);
        modalManager.open('view-request');

        const form = document.getElementById('editRequestForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateRequest(requestId, {
                adminReply: form.adminReply.value,
                estimatedCompletionDate: form.estimatedCompletionDate.value,
                status: form.status.value
            });
        });
    }

    updateRequest(requestId, data) {
        storage.updateRequest(requestId, data);
        this.loadData();
        this.renderRequests();
        this.renderStats();
        this.renderCharts();
        modalManager.close('view-request');
        toast.success('تم تحديث الطلب بنجاح');
    }

    getStatusClass(status) {
        const classes = {
            'Received': 'status-received',
            'Waiting Inspection': 'status-waiting-inspection',
            'Under Maintenance': 'status-under-maintenance',
            'Waiting Parts': 'status-waiting-parts',
            'Ready': 'status-ready',
            'Delivered': 'status-delivered'
        };
        return classes[status] || 'status-received';
    }

    translateStatus(status) {
        const statusMap = {
            'Received': 'تم الاستلام',
            'Waiting Inspection': 'بانتظار الفحص',
            'Under Maintenance': 'تحت الصيانة',
            'Waiting Parts': 'بانتظار قطع الغيار',
            'Ready': 'جاهز للتسليم',
            'Delivered': 'تم التسليم للعميل'
        };
        return statusMap[status] || status;
    }

    translatePriority(priority) {
        const priorityMap = {
            'Low': 'منخفضة',
            'Medium': 'متوسطة',
            'High': 'عالية',
            'Urgent': 'عاجلة'
        };
        return priorityMap[priority] || priority;
    }

    /**
     * Render daily report table
     */
    renderDailyReport() {
        const container = document.getElementById('dailyReportContainer');
        if (!container) return;

        const dateInput = document.getElementById('reportDate');
        const selectedDate = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);

        const allRequests = storage.getRequests();
        const dayRequests = allRequests.filter(r => {
            const d = new Date(r.createdAt);
            return d.toISOString().slice(0, 10) === selectedDate;
        });

        if (dayRequests.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="text-align:center; padding:3rem; margin-top:1.5rem;">
                    <i class="fas fa-calendar-times" style="font-size:3rem; color:#64748b; margin-bottom:1rem;"></i>
                    <p style="color:#94a3b8; font-size:1.1rem;">لا توجد طلبات في هذا اليوم</p>
                </div>`;
            return;
        }

        const rows = dayRequests.map((r, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${r.requestNumber}</td>
                <td>${r.fullName}</td>
                <td>${r.phone}</td>
                <td>${r.laptopBrand}${r.laptopModel ? ' ' + r.laptopModel : ''}</td>
                <td>${r.problemDescription}</td>
                <td><span class="status-badge ${this.getStatusClass(r.status)}">${this.translateStatus(r.status)}</span></td>
                <td>${r.cost > 0 ? Utils.formatCurrency(r.cost) : '—'}</td>
                <td>${Utils.formatDate(r.createdAt)}</td>
            </tr>`).join('');

        container.innerHTML = `
            <div class="glass-card" style="margin-top:1.5rem; overflow-x:auto;">
                <p style="color:#94a3b8; margin-bottom:1rem;">
                    <i class="fas fa-info-circle"></i>
                    إجمالي الطلبات: <strong style="color:#3b82f6;">${dayRequests.length}</strong>
                </p>
                <table class="table" style="width:100%; min-width:700px;">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>رقم الطلب</th>
                            <th>اسم العميل</th>
                            <th>الهاتف</th>
                            <th>الجهاز</th>
                            <th>المشكلة</th>
                            <th>الحالة</th>
                            <th>التكلفة</th>
                            <th>التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    }

    /**
     * Export daily report as Excel
     */
    exportDailyReport() {
        const dateInput = document.getElementById('reportDate');
        const selectedDate = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);

        const allRequests = storage.getRequests();
        const dayRequests = allRequests.filter(r => {
            const d = new Date(r.createdAt);
            return d.toISOString().slice(0, 10) === selectedDate;
        });

        if (dayRequests.length === 0) {
            toast.error('لا توجد طلبات في هذا اليوم');
            return;
        }

        const data = [
            ['#', 'رقم الطلب', 'اسم العميل', 'الهاتف', 'الجهاز', 'المشكلة', 'الحالة', 'التكلفة', 'التاريخ'],
            ...dayRequests.map((r, i) => [
                i + 1,
                r.requestNumber,
                r.fullName,
                r.phone,
                `${r.laptopBrand}${r.laptopModel ? ' ' + r.laptopModel : ''}`,
                r.problemDescription,
                this.translateStatus(r.status),
                r.cost > 0 ? r.cost : 0,
                Utils.formatDate(r.createdAt)
            ])
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        // Column widths
        ws['!cols'] = [
            {wch:4},{wch:14},{wch:20},{wch:14},{wch:18},
            {wch:35},{wch:18},{wch:10},{wch:20}
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'تقرير اليوم');
        XLSX.writeFile(wb, `YAS-تقرير-${selectedDate}.xlsx`);
        toast.success(`تم تصدير ${dayRequests.length} طلب بنجاح ✅`);
    }

    /**
     * Initialize admin dashboard
     */
    init() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        this.loadData();
        this.renderStats();
        this.renderCharts();

        // Setup sidebar navigation
        document.querySelectorAll('.sidebar-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                this.switchSection(link.dataset.section);
                if (link.dataset.section === 'daily-report') {
                    // Set today's date by default
                    const dateInput = document.getElementById('reportDate');
                    if (dateInput && !dateInput.value) {
                        dateInput.value = new Date().toISOString().slice(0, 10);
                    }
                    this.renderDailyReport();
                    // Re-render on date change
                    if (dateInput) {
                        dateInput.onchange = () => this.renderDailyReport();
                    }
                }
            });
        });

        // Setup logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Setup search and filters
        const searchInput = document.getElementById('requestSearch');
        const statusFilter = document.getElementById('statusFilter');

        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                this.currentPage = 1;
                this.renderRequests();
            }, 300));
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.renderRequests();
            });
        }
    }
}


// Create global instance
const adminManager = new AdminManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('adminDashboard')) {
        adminManager.init();
    }
});
