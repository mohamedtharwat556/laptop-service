/**
 * YAS Laptop Service Center - Audit Log Manager
 * Handles comprehensive audit logging system
 */

class AuditLogManager {
    constructor() {
        this.maxLogEntries = 1000;
        this.init();
    }

    init() {
        this.loadAuditLog();
    }

    /**
     * Load audit log from storage
     */
    loadAuditLog() {
        this.auditLog = storage.get('auditLog') || [];
    }

    /**
     * Save audit log to storage
     */
    saveAuditLog() {
        // Keep only last maxLogEntries
        if (this.auditLog.length > this.maxLogEntries) {
            this.auditLog = this.auditLog.slice(-this.maxLogEntries);
        }
        storage.set('auditLog', this.auditLog);
    }

    /**
     * Add audit log entry
     */
    log(action, details, userId = null, metadata = {}) {
        const entry = {
            id: storage.generateId(),
            action,
            details,
            userId,
            metadata,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'client-side' // Would be real IP on server
        };

        this.auditLog.unshift(entry);
        this.saveAuditLog();

        return entry;
    }

    /**
     * Get audit log with filters
     */
    getAuditLog(filters = {}) {
        let filteredLog = [...this.auditLog];

        if (filters.action) {
            filteredLog = filteredLog.filter(entry => entry.action === filters.action);
        }

        if (filters.userId) {
            filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
        }

        if (filters.startDate) {
            filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            filteredLog = filteredLog.filter(entry => new Date(entry.timestamp) <= new Date(filters.endDate));
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filteredLog = filteredLog.filter(entry => 
                entry.action.toLowerCase().includes(searchLower) ||
                JSON.stringify(entry.details).toLowerCase().includes(searchLower)
            );
        }

        return filteredLog;
    }

    /**
     * Get audit statistics
     */
    getStatistics() {
        const stats = {
            total: this.auditLog.length,
            byAction: {},
            byUser: {},
            byDate: {},
            last24Hours: 0,
            last7Days: 0,
            last30Days: 0
        };

        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        this.auditLog.forEach(entry => {
            // By action
            stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;

            // By user
            if (entry.userId) {
                stats.byUser[entry.userId] = (stats.byUser[entry.userId] || 0) + 1;
            }

            // By date
            const date = new Date(entry.timestamp).toLocaleDateString();
            stats.byDate[date] = (stats.byDate[date] || 0) + 1;

            // Time ranges
            const entryDate = new Date(entry.timestamp);
            if (entryDate >= last24Hours) stats.last24Hours++;
            if (entryDate >= last7Days) stats.last7Days++;
            if (entryDate >= last30Days) stats.last30Days++;
        });

        return stats;
    }

    /**
     * Render audit log table
     */
    renderAuditLogTable(filters = {}) {
        const logEntries = this.getAuditLog(filters);

        if (logEntries.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>No Audit Entries Found</h3>
                    <p>No audit logs match your criteria.</p>
                </div>
            `;
        }

        return `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Details</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logEntries.map(entry => `
                            <tr>
                                <td>${Utils.formatDate(entry.timestamp)}</td>
                                <td><span class="status-badge status-received">${entry.action}</span></td>
                                <td>${entry.userId || 'System'}</td>
                                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
                                    ${JSON.stringify(entry.details).substring(0, 100)}...
                                </td>
                                <td>${entry.ip}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render audit log dashboard
     */
    renderAuditDashboard() {
        const stats = this.getStatistics();

        return `
            <div class="audit-dashboard">
                <div class="dashboard-header">
                    <h2>Audit Log</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="auditManager.showFilterModal()">
                            <i class="fas fa-filter"></i> Filter
                        </button>
                        <button class="btn btn-secondary" onclick="exportManager.exportAuditLog()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <div class="stats-grid" style="margin-bottom: 2rem;">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-list"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.total}</h3>
                            <p>Total Entries</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.last24Hours}</h3>
                            <p>Last 24 Hours</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-calendar-week"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.last7Days}</h3>
                            <p>Last 7 Days</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.last30Days}</h3>
                            <p>Last 30 Days</p>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Actions by Type</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        ${Object.entries(stats.byAction).map(([action, count]) => `
                            <div style="padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                                <h4 style="margin-bottom: 0.5rem;">${action}</h4>
                                <p style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${count}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="glass-card" style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Recent Activity</h3>
                    <div id="auditLogTable">
                        ${this.renderAuditLogTable()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show filter modal
     */
    showFilterModal() {
        const content = `
            <form id="auditFilterForm">
                <div class="form-group">
                    <label class="form-label">Action Type</label>
                    <select class="form-select" name="action">
                        <option value="">All Actions</option>
                        <option value="LOGIN_SUCCESS">Login Success</option>
                        <option value="LOGIN_FAILED">Login Failed</option>
                        <option value="PASSWORD_CHANGE">Password Change</option>
                        <option value="USER_CREATED">User Created</option>
                        <option value="USER_UPDATED">User Updated</option>
                        <option value="USER_DELETED">User Deleted</option>
                        <option value="REQUEST_CREATED">Request Created</option>
                        <option value="REQUEST_UPDATED">Request Updated</option>
                        <option value="ORDER_CREATED">Order Created</option>
                        <option value="PRODUCT_CREATED">Product Created</option>
                        <option value="PRODUCT_UPDATED">Product Updated</option>
                        <option value="PRODUCT_DELETED">Product Deleted</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">User ID</label>
                    <input type="text" class="form-input" name="userId" placeholder="Enter user ID">
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Start Date</label>
                        <input type="date" class="form-input" name="startDate">
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date</label>
                        <input type="date" class="form-input" name="endDate">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Search</label>
                    <input type="text" class="form-input" name="search" placeholder="Search in details...">
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-search"></i> Apply Filter
                </button>
            </form>
        `;

        modalManager.create('audit-filter', 'Filter Audit Log', content);
        modalManager.open('audit-filter');

        const form = document.getElementById('auditFilterForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const filters = {
                action: form.action.value || null,
                userId: form.userId.value || null,
                startDate: form.startDate.value || null,
                endDate: form.endDate.value || null,
                search: form.search.value || null
            };

            modalManager.close('audit-filter');
            
            const tableContainer = document.getElementById('auditLogTable');
            if (tableContainer) {
                tableContainer.innerHTML = this.renderAuditLogTable(filters);
            }
        });
    }

    /**
     * Clear old audit logs
     */
    clearOldLogs(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const beforeCount = this.auditLog.length;
        this.auditLog = this.auditLog.filter(entry => new Date(entry.timestamp) >= cutoffDate);
        const afterCount = this.auditLog.length;

        this.saveAuditLog();

        return {
            deleted: beforeCount - afterCount,
            remaining: afterCount
        };
    }

    /**
     * Export audit log
     */
    exportAuditLog() {
        const exportData = this.auditLog.map(entry => ({
            Timestamp: Utils.formatDate(entry.timestamp),
            Action: entry.action,
            User: entry.userId || 'System',
            Details: JSON.stringify(entry.details),
            IP: entry.ip,
            UserAgent: entry.userAgent
        }));

        exportManager.exportToCSV(exportData, 'audit_log_export.csv');
    }

    /**
     * Get user activity summary
     */
    getUserActivitySummary(userId) {
        const userLogs = this.getAuditLog({ userId });
        
        const summary = {
            totalActions: userLogs.length,
            byAction: {},
            lastActivity: null,
            mostCommonAction: null
        };

        userLogs.forEach(log => {
            summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1;
        });

        if (userLogs.length > 0) {
            summary.lastActivity = userLogs[0].timestamp;
            
            const mostCommon = Object.entries(summary.byAction)
                .sort((a, b) => b[1] - a[1])[0];
            summary.mostCommonAction = mostCommon[0];
        }

        return summary;
    }

    /**
     * Get security events
     */
    getSecurityEvents() {
        const securityActions = [
            'LOGIN_FAILED',
            'LOGIN_SUCCESS',
            'PASSWORD_CHANGE',
            'PASSWORD_RESET',
            'ACCOUNT_LOCKED',
            'UNAUTHORIZED_ACCESS'
        ];

        return this.auditLog.filter(entry => 
            securityActions.includes(entry.action)
        );
    }

    /**
     * Render security events
     */
    renderSecurityEvents() {
        const events = this.getSecurityEvents();

        if (events.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-shield-alt"></i>
                    <h3>No Security Events</h3>
                    <p>No security-related events recorded.</p>
                </div>
            `;
        }

        return `
            <div class="glass-card" style="padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Security Events</h3>
                <div style="display: grid; gap: 1rem;">
                    ${events.slice(0, 20).map(event => `
                        <div style="padding: 1rem; background: ${event.action === 'LOGIN_FAILED' ? 'rgba(239, 68, 68, 0.1)' : 'var(--card-bg-subtle)'}; border-radius: 8px; border-left: 3px solid ${event.action === 'LOGIN_FAILED' ? '#ef4444' : '#10b981'};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <span class="status-badge ${event.action === 'LOGIN_FAILED' ? 'status-waiting-inspection' : 'status-ready'}" style="margin-bottom: 0.5rem;">
                                        ${event.action}
                                    </span>
                                    <p style="color: var(--text-muted-more); font-size: 0.875rem;">${Utils.formatDate(event.timestamp)}</p>
                                </div>
                                <span style="color: var(--text-muted-more); font-size: 0.875rem;">${event.userId || 'System'}</span>
                            </div>
                            <p style="margin-top: 0.5rem; color: var(--text-muted); font-size: 0.875rem;">
                                ${JSON.stringify(event.details)}
                            </p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Create global instance
const auditManager = new AuditLogManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    auditManager.init();
});
