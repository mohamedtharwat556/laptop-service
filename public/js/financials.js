/**
 * YAS Laptop Service Center - Financial Reports Manager
 * Handles detailed financial reports and analysis
 */

class FinancialReportsManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadFinancialData();
    }

    /**
     * Load financial data from storage
     */
    loadFinancialData() {
        this.orders = storage.getOrders() || [];
        this.requests = storage.getRequests() || [];
        this.products = storage.getProducts() || [];
    }

    /**
     * Get revenue by period
     */
    getRevenueByPeriod(period = 'monthly') {
        const revenueByPeriod = {};

        this.orders.forEach(order => {
            const date = new Date(order.createdAt);
            let key;

            switch (period) {
                case 'daily':
                    key = date.toDateString();
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toDateString();
                    break;
                case 'monthly':
                    key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    break;
                case 'quarterly':
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    key = `Q${quarter} ${date.getFullYear()}`;
                    break;
                case 'yearly':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            }

            if (!revenueByPeriod[key]) {
                revenueByPeriod[key] = {
                    revenue: 0,
                    orders: 0,
                    avgOrderValue: 0
                };
            }

            revenueByPeriod[key].revenue += order.total || 0;
            revenueByPeriod[key].orders += 1;
            revenueByPeriod[key].avgOrderValue = revenueByPeriod[key].revenue / revenueByPeriod[key].orders;
        });

        return revenueByPeriod;
    }

    /**
     * Get revenue by category
     */
    getRevenueByCategory() {
        const revenueByCategory = {};

        this.orders.forEach(order => {
            order.items.forEach(item => {
                const product = this.products.find(p => p.id === item.productId);
                if (product) {
                    const category = product.category;
                    if (!revenueByCategory[category]) {
                        revenueByCategory[category] = {
                            revenue: 0,
                            items: 0,
                            orders: 0
                        };
                    }
                    revenueByCategory[category].revenue += item.price * item.quantity;
                    revenueByCategory[category].items += item.quantity;
                    revenueByCategory[category].orders += 1;
                }
            });
        });

        return revenueByCategory;
    }

    /**
     * Get repair revenue
     */
    getRepairRevenue() {
        const repairRevenue = {
            total: 0,
            byStatus: {},
            byPriority: {},
            byBrand: {}
        };

        this.requests.forEach(request => {
            if (request.status === 'Delivered' && request.cost > 0) {
                repairRevenue.total += request.cost;

                const status = request.status;
                repairRevenue.byStatus[status] = (repairRevenue.byStatus[status] || 0) + request.cost;

                const priority = request.priority;
                repairRevenue.byPriority[priority] = (repairRevenue.byPriority[priority] || 0) + request.cost;

                const brand = request.laptopBrand;
                repairRevenue.byBrand[brand] = (repairRevenue.byBrand[brand] || 0) + request.cost;
            }
        });

        return repairRevenue;
    }

    /**
     * Get profit analysis
     */
    getProfitAnalysis() {
        // Simplified profit calculation (would need cost data in production)
        const totalRevenue = this.orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const repairRevenue = this.getRepairRevenue().total;
        const grossRevenue = totalRevenue + repairRevenue;

        // Assume 70% margin for products, 60% for repairs
        const productCost = totalRevenue * 0.3;
        const repairCost = repairRevenue * 0.4;
        const totalCost = productCost + repairCost;
        const grossProfit = grossRevenue - totalCost;
        const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue * 100).toFixed(2) : 0;

        return {
            totalRevenue,
            repairRevenue,
            grossRevenue,
            productCost,
            repairCost,
            totalCost,
            grossProfit,
            profitMargin
        };
    }

    /**
     * Get expense breakdown
     */
    getExpenseBreakdown() {
        const profitAnalysis = this.getProfitAnalysis();

        return {
            productCosts: profitAnalysis.productCost,
            repairCosts: profitAnalysis.repairCost,
            operationalCosts: profitAnalysis.grossRevenue * 0.1, // Assume 10% operational costs
            totalExpenses: profitAnalysis.totalCost + (profitAnalysis.grossRevenue * 0.1)
        };
    }

    /**
     * Get top selling products
     */
    getTopSellingProducts(limit = 10) {
        const productSales = {};

        this.orders.forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productId: item.productId,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].revenue += item.price * item.quantity;
            });
        });

        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit)
            .map(sale => {
                const product = this.products.find(p => p.id === sale.productId);
                return {
                    ...sale,
                    productName: product?.name || 'Unknown',
                    category: product?.category || 'Unknown'
                };
            });
    }

    /**
     * Get customer spending analysis
     */
    getCustomerSpendingAnalysis() {
        const customerSpending = {};

        this.orders.forEach(order => {
            const phone = order.customerPhone;
            if (!customerSpending[phone]) {
                customerSpending[phone] = {
                    phone,
                    totalSpent: 0,
                    orderCount: 0,
                    avgOrderValue: 0,
                    lastOrder: null
                };
            }
            customerSpending[phone].totalSpent += order.total || 0;
            customerSpending[phone].orderCount += 1;
            customerSpending[phone].avgOrderValue = customerSpending[phone].totalSpent / customerSpending[phone].orderCount;
            
            if (!customerSpending[phone].lastOrder || new Date(order.createdAt) > new Date(customerSpending[phone].lastOrder)) {
                customerSpending[phone].lastOrder = order.createdAt;
            }
        });

        return Object.values(customerSpending).sort((a, b) => b.totalSpent - a.totalSpent);
    }

    /**
     * Get payment method analysis (simulated)
     */
    getPaymentMethodAnalysis() {
        // In a real app, this would come from actual payment data
        return {
            'Credit Card': 60,
            'Cash': 20,
            'Bank Transfer': 15,
            'Digital Wallet': 5
        };
    }

    /**
     * Render financial dashboard
     */
    renderFinancialDashboard() {
        const profitAnalysis = this.getProfitAnalysis();
        const expenseBreakdown = this.getExpenseBreakdown();
        const revenueByPeriod = this.getRevenueByPeriod('monthly');
        const revenueByCategory = this.getRevenueByCategory();
        const repairRevenue = this.getRepairRevenue();
        const topProducts = this.getTopSellingProducts(5);

        return `
            <div class="financial-dashboard">
                <div class="dashboard-header">
                    <h2>Financial Reports</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="financialsManager.exportFinancialReport()">
                            <i class="fas fa-download"></i> Export Report
                        </button>
                    </div>
                </div>

                <!-- Key Financial Metrics -->
                <div class="stats-grid" style="margin-bottom: 2rem;">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${Utils.formatCurrency(profitAnalysis.grossRevenue)}</h3>
                            <p>Gross Revenue</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${Utils.formatCurrency(profitAnalysis.grossProfit)}</h3>
                            <p>Gross Profit</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${profitAnalysis.profitMargin}%</h3>
                            <p>Profit Margin</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${Utils.formatCurrency(repairRevenue.total)}</h3>
                            <p>Repair Revenue</p>
                        </div>
                    </div>
                </div>

                <!-- Revenue Charts -->
                <div class="charts-grid" style="margin-bottom: 2rem;">
                    <div class="glass-card chart-card">
                        <h3>Monthly Revenue</h3>
                        <div class="chart-container">
                            <canvas id="monthlyRevenueChart"></canvas>
                        </div>
                    </div>
                    <div class="glass-card chart-card">
                        <h3>Revenue by Category</h3>
                        <div class="chart-container">
                            <canvas id="categoryRevenueChart"></canvas>
                        </div>
                    </div>
                    <div class="glass-card chart-card">
                        <h3>Expense Breakdown</h3>
                        <div class="chart-container">
                            <canvas id="expenseChart"></canvas>
                        </div>
                    </div>
                    <div class="glass-card chart-card">
                        <h3>Payment Methods</h3>
                        <div class="chart-container">
                            <canvas id="paymentMethodChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Detailed Tables -->
                <div style="display: grid; gap: 2rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">Top Selling Products</h3>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Units Sold</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${topProducts.map(product => `
                                        <tr>
                                            <td>${product.productName}</td>
                                            <td>${product.category}</td>
                                            <td>${product.quantity}</td>
                                            <td>${Utils.formatCurrency(product.revenue)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">Revenue by Brand (Repairs)</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                            ${Object.entries(repairRevenue.byBrand).map(([brand, revenue]) => `
                                <div style="padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                                    <h4 style="margin-bottom: 0.5rem;">${brand}</h4>
                                    <p style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${Utils.formatCurrency(revenue)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize financial charts
     */
    initCharts() {
        const revenueByPeriod = this.getRevenueByPeriod('monthly');
        const revenueByCategory = this.getRevenueByCategory();
        const expenseBreakdown = this.getExpenseBreakdown();
        const paymentMethods = this.getPaymentMethodAnalysis();

        // Monthly Revenue Chart
        const monthlyCtx = document.getElementById('monthlyRevenueChart');
        if (monthlyCtx) {
            new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: Object.keys(revenueByPeriod),
                    datasets: [{
                        label: 'Revenue',
                        data: Object.values(revenueByPeriod).map(p => p.revenue),
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
                        x: { ticks: { color: '#94a3b8' } },
                        y: { ticks: { color: '#94a3b8', callback: v => '$' + v } }
                    }
                }
            });
        }

        // Category Revenue Chart
        const categoryCtx = document.getElementById('categoryRevenueChart');
        if (categoryCtx) {
            new Chart(categoryCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(revenueByCategory),
                    datasets: [{
                        data: Object.values(revenueByCategory).map(c => c.revenue),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
                }
            });
        }

        // Expense Chart
        const expenseCtx = document.getElementById('expenseChart');
        if (expenseCtx) {
            new Chart(expenseCtx, {
                type: 'bar',
                data: {
                    labels: ['Product Costs', 'Repair Costs', 'Operational Costs'],
                    datasets: [{
                        label: 'Expenses',
                        data: [expenseBreakdown.productCosts, expenseBreakdown.repairCosts, expenseBreakdown.operationalCosts],
                        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#94a3b8' } },
                        y: { ticks: { color: '#94a3b8', callback: v => '$' + v } }
                    }
                }
            });
        }

        // Payment Method Chart
        const paymentCtx = document.getElementById('paymentMethodChart');
        if (paymentCtx) {
            new Chart(paymentCtx, {
                type: 'pie',
                data: {
                    labels: Object.keys(paymentMethods),
                    datasets: [{
                        data: Object.values(paymentMethods),
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } }
                }
            });
        }
    }

    /**
     * Export financial report
     */
    exportFinancialReport() {
        const profitAnalysis = this.getProfitAnalysis();
        const revenueByPeriod = this.getRevenueByPeriod('monthly');
        const revenueByCategory = this.getRevenueByCategory();
        const repairRevenue = this.getRepairRevenue();

        const exportData = [
            {
                'Metric': 'Value',
                'Gross Revenue': profitAnalysis.grossRevenue,
                'Gross Profit': profitAnalysis.grossProfit,
                'Profit Margin': profitAnalysis.profitMargin + '%',
                'Product Revenue': profitAnalysis.totalRevenue,
                'Repair Revenue': profitAnalysis.repairRevenue,
                'Export Date': Utils.formatDate(new Date().toISOString())
            },
            ...Object.entries(revenueByPeriod).map(([period, data]) => ({
                'Period': period,
                'Revenue': data.revenue,
                'Orders': data.orders,
                'Average Order': data.avgOrderValue
            })),
            ...Object.entries(revenueByCategory).map(([category, data]) => ({
                'Category': category,
                'Revenue': data.revenue,
                'Items Sold': data.items,
                'Orders': data.orders
            }))
        ];

        exportManager.exportToCSV(exportData, 'financial_report.csv');
    }

    /**
     * Generate comprehensive financial report
     */
    generateComprehensiveReport(startDate, endDate) {
        const filteredOrders = this.orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
        });

        const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            period: { startDate, endDate },
            summary: {
                totalRevenue,
                totalOrders,
                avgOrderValue
            },
            revenueByPeriod: this.getRevenueByPeriod('monthly'),
            revenueByCategory: this.getRevenueByCategory(),
            profitAnalysis: this.getProfitAnalysis(),
            topProducts: this.getTopSellingProducts(10)
        };
    }
}

// Create global instance
const financialsManager = new FinancialReportsManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    financialsManager.init();
});
