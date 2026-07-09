/**
 * YAS Laptop Service Center - Export Manager
 * Handles data export to Excel/CSV functionality
 */

class ExportManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize any required setup
    }

    /**
     * Export data to CSV
     */
    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value || '').replace(/"/g, '""');
                    return stringValue.includes(',') || stringValue.includes('"') 
                        ? `"${stringValue}"` 
                        : stringValue;
                }).join(',')
            )
       ()].join('\n');

        this.downloadFile(csvContent, filename, 'text/csv');
        toast.success('Data exported successfully');
    }

    /**
     * Export requests to CSV
     */
    exportRequests() {
        const requests = storage.getRequests();
        const exportData = requests.map(r => ({
            'Request Number': r.requestNumber,
            'Customer Name': r.fullName,
            'Phone': r.phone,
            'Laptop Brand': r.laptopBrand,
            'Laptop Model': r.laptopModel,
            'Device Type': r.deviceType,
            'Problem': r.problemDescription,
            'Priority': r.priority,
            'Status': r.status,
            'Cost': r.cost || 0,
            'Created Date': Utils.formatDate(r.createdAt),
            'Updated Date': Utils.formatDate(r.updatedAt),
            'Technician Notes': r.technicianNotes || '',
            'Notes': r.notes || ''
        }));

        this.exportToCSV(exportData, 'requests_export.csv');
    }

    /**
     * Export orders to CSV
     */
    exportOrders() {
        const orders = storage.getOrders();
        const exportData = orders.map(o => ({
            'Order Number': o.orderNumber,
            'Customer Name': o.customerName,
            'Phone': o.customerPhone,
            'Address': o.customerAddress,
            'Items Count': o.items.length,
            'Subtotal': o.subtotal,
            'Shipping': o.shipping,
            'Tax': o.tax,
            'Total': o.total,
            'Status': o.status,
            'Created Date': Utils.formatDate(o.createdAt)
        }));

        this.exportToCSV(exportData, 'orders_export.csv');
    }

    /**
     * Export products to CSV
     */
    exportProducts() {
        const products = storage.getProducts();
        const exportData = products.map(p => ({
            'ID': p.id,
            'Name': p.name,
            'Category': p.category,
            'Price': p.price,
            'Stock': p.stock,
            'Description': p.description,
            'Created Date': Utils.formatDate(p.createdAt)
        }));

        this.exportToCSV(exportData, 'products_export.csv');
    }

    /**
     * Export users to CSV
     */
    exportUsers() {
        const users = storage.getUsers();
        const exportData = users.map(u => ({
            'ID': u.id,
            'Username': u.username,
            'Name': u.name,
            'Email': u.email || '',
            'Role': u.role,
            'Created Date': Utils.formatDate(u.createdAt)
        }));

        this.exportToCSV(exportData, 'users_export.csv');
    }

    /**
     * Export statistics to CSV
     */
    exportStatistics() {
        const stats = storage.getStatistics();
        const exportData = [{
            'Metric': 'Value',
            'Total Requests': stats.totalRequests,
            'Open Requests': stats.openRequests,
            'Completed Requests': stats.completedRequests,
            'Today Orders': stats.todayOrders,
            'Total Revenue': stats.totalRevenue,
            'Total Products': stats.totalProducts,
            'Total Orders': stats.totalOrders,
            'Export Date': Utils.formatDate(new Date().toISOString())
        }];

        this.exportToCSV(exportData, 'statistics_export.csv');
    }

    /**
     * Export to Excel format (simulated with HTML table)
     */
    exportToExcel(data, filename) {
        if (!data || data.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        let html = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    table { border-collapse: collapse; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        this.downloadFile(html, filename, 'application/vnd.ms-excel');
        toast.success('Data exported to Excel format');
    }

    /**
     * Export requests to Excel
     */
    exportRequestsToExcel() {
        const requests = storage.getRequests();
        const exportData = requests.map(r => ({
            'Request Number': r.requestNumber,
            'Customer Name': r.fullName,
            'Phone': r.phone,
            'Laptop Brand': r.laptopBrand,
            'Laptop Model': r.laptopModel,
            'Device Type': r.deviceType,
            'Problem': r.problemDescription,
            'Priority': r.priority,
            'Status': r.status,
            'Cost': r.cost || 0,
            'Created Date': Utils.formatDate(r.createdAt),
            'Updated Date': Utils.formatDate(r.updatedAt)
        }));

        this.exportToExcel(exportData, 'requests_export.xls');
    }

    /**
     * Export orders to Excel
     */
    exportOrdersToExcel() {
        const orders = storage.getOrders();
        const exportData = orders.map(o => ({
            'Order Number': o.orderNumber,
            'Customer Name': o.customerName,
            'Phone': o.customerPhone,
            'Address': o.customerAddress,
            'Items Count': o.items.length,
            'Subtotal': o.subtotal,
            'Shipping': o.shipping,
            'Tax': o.tax,
            'Total': o.total,
            'Status': o.status,
            'Created Date': Utils.formatDate(o.createdAt)
        }));

        this.exportToExcel(exportData, 'orders_export.xls');
    }

    /**
     * Export products to Excel
     */
    exportProductsToExcel() {
        const products = storage.getProducts();
        const exportData = products.map(p => ({
            'ID': p.id,
            'Name': p.name,
            'Category': p.category,
            'Price': p.price,
            'Stock': p.stock,
            'Description': p.description,
            'Created Date': Utils.formatDate(p.createdAt)
        }));

        this.exportToExcel(exportData, 'products_export.xls');
    }

    /**
     * Export users to Excel
     */
    exportUsersToExcel() {
        const users = storage.getUsers();
        const exportData = users.map(u => ({
            'ID': u.id,
            'Username': u.username,
            'Name': u.name,
            'Email': u.email || '',
            'Role': u.role,
            'Created Date': Utils.formatDate(u.createdAt)
        }));

        this.exportToExcel(exportData, 'users_export.xls');
    }

    /**
     * Download file helper
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export all data (backup)
     */
    exportAllData() {
        const allData = {
            users: storage.getUsers(),
            requests: storage.getRequests(),
            orders: storage.getOrders(),
            products: storage.getProducts(),
            reviews: storage.get('reviews') || [],
            notifications: storage.get('notifications') || [],
            exportDate: new Date().toISOString()
        };

        const jsonContent = JSON.stringify(allData, null, 2);
        this.downloadFile(jsonContent, 'yas_backup.json', 'application/json');
        toast.success('Full backup exported successfully');
    }

    /**
     * Import data from backup
     */
    importData(jsonFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.users || !data.requests || !data.products) {
                        throw new Error('Invalid backup file structure');
                    }

                    // Restore data
                    storage.set('users', data.users);
                    storage.set('requests', data.requests);
                    storage.set('orders', data.orders || []);
                    storage.set('products', data.products);
                    storage.set('reviews', data.reviews || []);
                    storage.set('notifications', data.notifications || []);

                    toast.success('Data imported successfully');
                    resolve(data);
                } catch (error) {
                    toast.error('Failed to import data: ' + error.message);
                    reject(error);
                }
            };

            reader.onerror = () => {
                toast.error('Failed to read file');
                reject(new Error('File read error'));
            };

            reader.readAsText(jsonFile);
        });
    }

    /**
     * Render export menu
     */
    renderExportMenu() {
        return `
            <div class="export-menu glass-card" style="padding: 1.5rem;">
                <h3 style="margin-bottom: 1.5rem;">Export Data</h3>
                
                <div style="display: grid; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">Maintenance Requests</h4>
                            <p style="color: #94a3b8; font-size: 0.875rem;">Export all repair requests</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="exportManager.exportRequests()">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button class="btn btn-secondary" onclick="exportManager.exportRequestsToExcel()">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">Orders</h4>
                            <p style="color: #94a3b8; font-size: 0.875rem;">Export all purchase orders</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="exportManager.exportOrders()">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button class="btn btn-secondary" onclick="exportManager.exportOrdersToExcel()">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">Products</h4>
                            <p style="color: #94a3b8; font-size: 0.875rem;">Export product catalog</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="exportManager.exportProducts()">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button class="btn btn-secondary" onclick="exportManager.exportProductsToExcel()">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">Users</h4>
                            <p style="color: #94a3b8; font-size: 0.875rem;">Export user accounts</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary" onclick="exportManager.exportUsers()">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button class="btn btn-secondary" onclick="exportManager.exportUsersToExcel()">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div>
                            <h4 style="margin-bottom: 0.25rem;">Statistics</h4>
                            <p style="color: #94a3b8; font-size: 0.875rem;">Export dashboard statistics</p>
                        </div>
                        <button class="btn btn-secondary" onclick="exportManager.exportStatistics()">
                            <i class="fas fa-file-csv"></i> CSV
                        </button>
                    </div>

                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin-bottom: 0.25rem;">Full Backup</h4>
                                <p style="color: #94a3b8; font-size: 0.875rem;">Export all data as JSON backup</p>
                            </div>
                            <button class="btn btn-primary" onclick="exportManager.exportAllData()">
                                <i class="fas fa-download"></i> Backup
                            </button>
                        </div>
                    </div>

                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin-bottom: 0.25rem;">Import Backup</h4>
                                <p style="color: #94a3b8; font-size: 0.875rem;">Restore data from JSON backup</p>
                            </div>
                            <input type="file" id="importFile" accept=".json" style="display: none;" 
                                   onchange="exportManager.handleImport(this)">
                            <button class="btn btn-success" onclick="document.getElementById('importFile').click()">
                                <i class="fas fa-upload"></i> Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle file import
     */
    handleImport(input) {
        const file = input.files[0];
        if (!file) return;

        this.importData(file).then(() => {
            setTimeout(() => location.reload(), 1500);
        });
    }
}

// Create global instance
const exportManager = new ExportManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    exportManager.init();
});
