/**
 * YAS Laptop Service Center - Hikvision Admin Dashboard Module
 * Handles Hikvision-specific dashboard management
 */

class HikvisionAdminManager {
    constructor() {
        this.apiBase = '/api';
        this.requests = [];
        this.init();
    }

    async init() {
        await this.loadRequests();
        this.renderDashboard();
    }

    async loadRequests() {
        try {
            const response = await fetch('/api/requests');
            if (!response.ok) throw new Error('Failed to load requests');

            const data = await response.json();
            // Filter only Hikvision requests
            this.requests = data.filter(r =>
                r.requestType === 'hikvision' || r.request_type === 'hikvision'
            );

            console.log('📊 Loaded Hikvision requests:', this.requests.length);
        } catch (error) {
            console.error('Error loading Hikvision requests:', error);
            this.requests = [];
        }
    }

    renderDashboard() {
        const content = document.getElementById('hikvisionContent');
        if (!content) return;

        content.innerHTML = `
            <div class="dashboard-header">
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-icon">📦</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.requests.length}</div>
                            <div class="stat-label">إجمالي طلبات Hikvision</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.requests.filter(r => r.status === 'Pending').length}</div>
                            <div class="stat-label">قيد الانتظار</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.requests.filter(r => r.status === 'Completed').length}</div>
                            <div class="stat-label">مكتملة</div>
                        </div>
                    </div>
                </div>
                <div class="dashboard-actions">
                    <button class="btn btn-primary" onclick="hikvisionAdminManager.exportToExcel()">
                        <i class="fas fa-file-excel"></i> تصدير Excel
                    </button>
                </div>
            </div>

            <div class="requests-table-container">
                <table class="requests-table">
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>الاسم</th>
                            <th>رقم الهاتف</th>
                            <th>الماركة</th>
                            <th>الموديل</th>
                            <th>الرقم التسلسلي</th>
                            <th>تاريخ الاستلام</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderTableRows()}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderTableRows() {
        if (this.requests.length === 0) {
            return '<tr><td colspan="9" style="text-align: center; padding: 2rem;">لا توجد طلبات Hikvision</td></tr>';
        }

        return this.requests.map(request => `
            <tr>
                <td><strong>${request.requestNumber}</strong></td>
                <td>${request.fullName}</td>
                <td>${request.phone}</td>
                <td>${request.laptopBrand}</td>
                <td>${request.laptopModel}</td>
                <td>${request.serialNumber || '-'}</td>
                <td>${this.formatDate(request.receivedDate)}</td>
                <td><span class="status-badge status-${request.status?.toLowerCase() || 'pending'}">${this.translateStatus(request.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="hikvisionAdminManager.viewRequest('${request.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="hikvisionAdminManager.deleteRequest('${request.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-EG');
    }

    translateStatus(status) {
        const statusMap = {
            'Pending': 'قيد الانتظار',
            'In Progress': 'قيد العمل',
            'Completed': 'مكتمل',
            'Delivered': 'تم التسليم'
        };
        return statusMap[status] || status;
    }

    viewRequest(id) {
        const request = this.requests.find(r => r.id === id);
        if (!request) return;

        alert(`
            تفاصيل طلب Hikvision
            ══════════════════════
            رقم الطلب: ${request.requestNumber}
            الاسم: ${request.fullName}
            رقم الهاتف: ${request.phone}
            الماركة: ${request.laptopBrand}
            الموديل: ${request.laptopModel}
            الرقم التسلسلي: ${request.serialNumber || '-'}
            تاريخ الاستلام: ${this.formatDate(request.receivedDate)}
            وصف المشكلة: ${request.problemDescription}
            الحالة: ${this.translateStatus(request.status)}
        `);
    }

    async deleteRequest(id) {
        if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) return;

        try {
            const response = await fetch(`/api/requests/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete request');

            alert('تم حذف الطلب بنجاح');
            await this.loadRequests();
            this.renderDashboard();
        } catch (error) {
            console.error('Error deleting request:', error);
            alert('فشل حذف الطلب');
        }
    }

    exportToExcel() {
        if (this.requests.length === 0) {
            alert('لا توجد طلبات للتصدير');
            return;
        }

        const data = this.requests.map(r => ({
            'رقم الطلب': r.requestNumber,
            'الاسم': r.fullName,
            'رقم الهاتف': r.phone,
            'الماركة': r.laptopBrand,
            'الموديل': r.laptopModel,
            'الرقم التسلسلي': r.serialNumber || '-',
            'تاريخ الاستلام': this.formatDate(r.receivedDate),
            'وصف المشكلة': r.problemDescription,
            'الحالة': this.translateStatus(r.status)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Hikvision Requests');
        XLSX.writeFile(wb, 'hikvision-requests.xlsx');
    }
}

// Initialize
const hikvisionAdminManager = new HikvisionAdminManager();
