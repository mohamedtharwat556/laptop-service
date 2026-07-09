/**
 * YAS Laptop Service Center - Analytics Manager
 * Handles advanced reporting and analytics
 */

class AnalyticsManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize any required setup
    }

    /**
     * Get detailed request analytics
     */
    getRequestAnalytics() {
        const requests = storage.getRequests();
        
        const byStatus = {};
        const byPriority = {};
        const byBrand = {};
        const byDeviceType = {};
        const byMonth = {};
        const avgCompletionTime = [];
        
        requests.forEach(r => {
            // By status
            byStatus[r.status] = (byStatus[r.status] || 0) + 1;
            
            // By priority
            byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
            
            // By brand
            byBrand[r.laptopBrand] = (byBrand[r.laptopBrand] || 0) + 1;
            
            // By device type
            byDeviceType[r.deviceType] = (byDeviceType[r.deviceType] || 0) + 1;
            
            // By month
            const month = new Date(r.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
            byMonth[month] = (byMonth[month] || 0) + 1;
            
            // Completion time
            if (r.status === 'Delivered' && r.updatedAt) {
                const completionTime = new Date(r.updatedAt) - new Date(r.createdAt);
                avgCompletionTime.push(completionTime);
            }
        });

        const avgTime = avgCompletionTime.length > 0 
            ? avgCompletionTime.reduce((a, b) => a + b, 0) / avgCompletionTime.length 
            : 0;

        return {
            total: requests.length,
            byStatus,
            byPriority,
            byBrand,
            byDeviceType,
            byMonth,
            averageCompletionTime: Math.round(avgTime / (1000 * 60 * 60 * 24)), // in days
            completionRate: requests.length > 0 
                ? ((byStatus['Delivered'] || 0) / requests.length * 100).toFixed(1) 
                : 0
        };
    }

    /**
     * Get detailed order analytics
     */
    getOrderAnalytics() {
        const orders = storage.getOrders();
        
        const byMonth = {};
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
        const itemsPerOrder = orders.length > 0 
            ? orders.reduce((sum, o) => sum + o.items.length, 0) / orders.length 
            : 0;

        orders.forEach(o => {
            const month = new Date(o.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
            byMonth[month] = {
                count: (byMonth[month]?.count || 0) + 1,
                revenue: (byMonth[month]?.revenue || 0) + (o.total || 0)
            };
        });

        return {
            total: orders.length,
            totalRevenue,
            avgOrderValue,
            itemsPerOrder,
            byMonth
        };
    }

    /**
     * Get product analytics
     */
    getProductAnalytics() {
        const products = storage.getProducts();
        const orders = storage.getOrders();
        
        // Product popularity
        const productSales = {};
        orders.forEach(o => {
            o.items.forEach(item => {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            });
        });

        const productAnalytics = products.map(p => ({
            ...p,
            totalSold: productSales[p.id] || 0,
            revenue: (productSales[p.id] || 0) * p.price
        })).sort((a, b) => b.totalSold - a.totalSold);

        const byCategory = {};
        products.forEach(p => {
            byCategory[p.category] = (byCategory[p.category] || 0) + 1;
        });

        const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
        const lowStock = products.filter(p => p.stock < 5).length;

        return {
            total: products.length,
            byCategory,
            totalStock,
            lowStock,
            topProducts: productAnalytics.slice(0, 10),
            totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
        };
    }

    /**
     * Get revenue analytics with trends
     */
    getRevenueAnalytics() {
        const orders = storage.getOrders();
        const requests = storage.getRequests();
        
        // Last 30 days revenue
        const dailyRevenue = {};
        const last30Days = [];
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            last30Days.push(dateStr);
            dailyRevenue[dateStr] = 0;
        }

        orders.forEach(o => {
            const dateStr = new Date(o.createdAt).toDateString();
            if (dailyRevenue.hasOwnProperty(dateStr)) {
                dailyRevenue[dateStr] += o.total || 0;
            }
        });

        // Revenue from repairs
        const repairRevenue = requests
            .filter(r => r.status === 'Delivered' && r.cost > 0)
            .reduce((sum, r) => sum + (r.cost || 0), 0);

        // Monthly comparison
        const thisMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
            .toLocaleString('default', { month: 'long', year: 'numeric' });

        const thisMonthRevenue = orders
            .filter(o => new Date(o.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }) === thisMonth)
            .reduce((sum, o) => sum + (o.total || 0), 0);

        const lastMonthRevenue = orders
            .filter(o => new Date(o.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }) === lastMonth)
            .reduce((sum, o) => sum + (o.total || 0), 0);

        const growthRate = lastMonthRevenue > 0 
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
            : 0;

        return {
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            repairRevenue,
            dailyRevenue,
            last30Days,
            thisMonthRevenue,
            lastMonthRevenue,
            growthRate,
            averageDailyRevenue: Object.values(dailyRevenue).reduce((a, b) => a + b, 0) / 30
        };
    }

    /**
     * Get customer analytics
     */
    getCustomerAnalytics() {
        const requests = storage.getRequests();
        const orders = storage.getOrders();
        
        // Unique customers
        const uniqueCustomers = new Set([
            ...requests.map(r => r.phone),
            ...orders.map(o => o.customerPhone)
        ]);

        // Repeat customers
        const customerRequestCount = {};
        requests.forEach(r => {
            customerRequestCount[r.phone] = (customerRequestCount[r.phone] || 0) + 1;
        });

        const repeatCustomers = Object.values(customerRequestCount).filter(count => count > 1).length;

        // Customer satisfaction (simulated)
        const reviews = storage.get('reviews') || [];
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;

        return {
            totalCustomers: uniqueCustomers.size,
            repeatCustomers,
            repeatRate: uniqueCustomers.size > 0 
                ? (repeatCustomers / uniqueCustomers.size * 100).toFixed(1) 
                : 0,
            avgRating,
            totalReviews: reviews.length
        };
    }

    /**
     * Generate comprehensive report
     */
    generateReport(reportType, dateRange = '30') {
        const report = {
            type: reportType,
            dateRange,
            generatedAt: new Date().toISOString(),
            data: {}
        };

        switch (reportType) {
            case 'requests':
                report.data = this.getRequestAnalytics();
                break;
            case 'orders':
                report.data = this.getOrderAnalytics();
                break;
            case 'products':
                report.data = this.getProductAnalytics();
                break;
            case 'revenue':
                report.data = this.getRevenueAnalytics();
                break;
            case 'customers':
                report.data = this.getCustomerAnalytics();
                break;
            case 'comprehensive':
                report.data = {
                    requests: this.getRequestAnalytics(),
                    orders: this.getOrderAnalytics(),
                    products: this.getProductAnalytics(),
                    revenue: this.getRevenueAnalytics(),
                    customers: this.getCustomerAnalytics()
                };
                break;
        }

        return report;
    }

    /**
     * Render analytics dashboard
     */
    renderAnalyticsDashboard() {
        const requestAnalytics = this.getRequestAnalytics();
        const orderAnalytics = this.getOrderAnalytics();
        const productAnalytics = this.getProductAnalytics();
        const revenueAnalytics = this.getRevenueAnalytics();
        const customerAnalytics = this.getCustomerAnalytics();

        return `
            <div class="analytics-dashboard">
                <div class="dashboard-header">
                    <h2>Advanced Analytics</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" onclick="analyticsManager.generateReport('comprehensive')">
                            <i class="fas fa-chart-bar"></i> Generate Report
                        </button>
                        <button class="btn btn-secondary" onclick="exportManager.exportStatistics()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <!-- Key Metrics -->
                <div class="stats-grid" style="margin-bottom: 2rem;">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${Utils.formatCurrency(revenueAnalytics.totalRevenue)}</h3>
                            <p>Total Revenue</p>
                            <span style="font-size: 0.75rem; color: ${revenueAnalytics.growthRate >= 0 ? '#10b981' : '#ef4444'};">
                                ${revenueAnalytics.growthRate >= 0 ? '+' : ''}${revenueAnalytics.growthRate}% vs last month
                            </span>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-clipboard-check"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${requestAnalytics.completionRate}%</h3>
                            <p>Completion Rate</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${requestAnalytics.averageCompletionTime}d</h3>
                            <p>Avg Completion Time</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${customerAnalytics.totalCustomers}</h3>
                            <p>Total Customers</p>
                            <span style="font-size: 0.75rem; color: #94a3b8;">
                                ${customerAnalytics.repeatRate}% repeat
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <div class="glass-card chart-card">
                        <h3>Requests by Status</h3>
                        <div class="chart-container">
                            <canvas id="analyticsStatusChart"></canvas>
                        </div>
                    </div>
                    <div class="glass-card chart-card">
                        <h3>Revenue Trend (30 Days)</h3>
                        <div class="chart-container">
                            <canvas id="analyticsRevenueChart"></canvas>
                        </div>
                    </div>
                    <div class="glass-card chart-card">
                        <h3>Top Laptop Brands</h3>
                        <div class="chart-container">
                            <canvas id="analyticsBrandChart"></canvas>
                        </div>
                    </div>
                    <div class="glass-card chart-card">
                        <h3>Monthly Orders</h3>
                        <div class="chart-container">
                            <canvas id="analyticsOrdersChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Detailed Tables -->
                <div class="glass-card" style="padding: 1.5rem; margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Top Selling Products</h3>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Total Sold</th>
                                    <th>Revenue</th>
                                    <th>Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productAnalytics.topProducts.slice(0, 5).map(p => `
                                    <tr>
                                        <td>${p.name}</td>
                                        <td>${p.category}</td>
                                        <td>${p.totalSold}</td>
                                        <td>${Utils.formatCurrency(p.revenue)}</td>
                                        <td style="color: ${p.stock < 5 ? '#ef4444' : '#10b981'}">${p.stock}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="glass-card" style="padding: 1.5rem; margin-top: 2rem;">
                    <h3 style="margin-break: 1rem;">Request Distribution by Priority</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        ${Object.entries(requestAnalytics.byPriority).map(([priority, count]) => `
                            <div style="padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem;">${priority}</h4>
                                <p style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${count}</p>
                                <p style="color: #94a3b8; font-size: 0.875rem;">
                                    ${((count / requestAnalytics.total) * 100).toFixed(1)}% of total
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize analytics charts
     */
    initCharts() {
        const requestAnalytics = this.getRequestAnalytics();
        const revenueAnalytics = this.getRevenueAnalytics();
        const orderAnalytics = this.getOrderAnalytics();

        // Status Chart
        const statusCtx = document.getElementById('analyticsStatusChart');
        if (statusCtx) {
            new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(requestAnalytics.byStatus),
                    datasets: [{
                        data: Object.values(requestAnalytics.byStatus),
                        backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#22c55e']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                    }
                }
            });
        }

        // Revenue Chart
        const revenueCtx = document.getElementById('analyticsRevenueChart');
        if (revenueCtx) {
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: revenueAnalytics.last30Days,
                    datasets: [{
                        label: 'Revenue',
                        data: revenueAnalytics.last30Days.map(d => revenueAnalytics.dailyRevenue[d]),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8', maxTicksLimit: 7 } },
                        y: { ticks: { color: '#94a3b8', callback: v => '$' + v } }
                    }
                }
            });
        }

        // Brand Chart
        const brandCtx = document.getElementById('analyticsBrandChart');
        if (brandCtx) {
            new Chart(brandCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(requestAnalytics.byBrand),
                    datasets: [{
                        label: 'Requests',
                        data: Object.values(requestAnalytics.byBrand),
                        backgroundColor: '#3b82f6'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' } },
                        y: { ticks: { color: '#94a3b8' } }
                    }
                }
            });
        }

        // Orders Chart
        const ordersCtx = document.getElementById('analyticsOrdersChart');
        if (ordersCtx) {
            new Chart(ordersCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(orderAnalytics.byMonth),
                    datasets: [{
                        label: 'Orders',
                        data: Object.values(orderAnalytics.byMonth).map(m => m.count),
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' } },
                        y: { ticks: { color: '#94a3b8' } }
                    }
                }
            });
        }
    }
}

// Create global instance
const analyticsManager = new AnalyticsManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    analyticsManager.init();
});
