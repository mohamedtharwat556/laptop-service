/**
 * YAS Laptop Service Center - Permissions Manager
 * Handles advanced permissions management for users
 */

class PermissionsManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadPermissions();
    }

    /**
     * Load permissions from storage
     */
    loadPermissions() {
        this.permissions = storage.get('permissions') || this.getDefaultPermissions();
    }

    /**
     * Save permissions to storage
     */
    savePermissions() {
        storage.set('permissions', this.permissions);
    }

    /**
     * Get default permissions for each role
     */
    getDefaultPermissions() {
        return {
            admin: {
                users: ['create', 'read', 'update', 'delete'],
                requests: ['create', 'read', 'update', 'delete'],
                orders: ['create', 'read', 'update', 'delete'],
                products: ['create', 'read', 'update', 'delete'],
                categories: ['create', 'read', 'update', 'delete'],
                reports: ['read', 'export'],
                settings: ['read', 'update'],
                audit: ['read'],
                permissions: ['read', 'update']
            },
            employee: {
                users: ['read'],
                requests: ['create', 'read', 'update'],
                orders: ['read', 'update'],
                products: ['read', 'update'],
                categories: ['read'],
                reports: ['read'],
                settings: ['read'],
                audit: [],
                permissions: []
            },
            technician: {
                users: [],
                requests: ['read', 'update'],
                orders: [],
                products: ['read'],
                categories: ['read'],
                reports: ['read'],
                settings: ['read'],
                audit: [],
                permissions: []
            },
            customer: {
                users: [],
                requests: ['create', 'read'],
                orders: ['create', 'read'],
                products: ['read'],
                categories: ['read'],
                reports: [],
                settings: ['read'],
                audit: [],
                permissions: []
            }
        };
    }

    /**
     * Get permissions for a role
     */
    getPermissionsForRole(role) {
        return this.permissions[role] || {};
    }

    /**
     * Check if a role has permission for an action on a resource
     */
    hasPermission(role, resource, action) {
        const rolePermissions = this.getPermissionsForRole(role);
        const resourcePermissions = rolePermissions[resource] || [];
        return resourcePermissions.includes(action);
    }

    /**
     * Update permissions for a role
     */
    updateRolePermissions(role, resource, permissions) {
        if (!this.permissions[role]) {
            this.permissions[role] = {};
        }
        this.permissions[role][resource] = permissions;
        this.savePermissions();
    }

    /**
     * Add permission to role
     */
    addPermission(role, resource, action) {
        if (!this.permissions[role]) {
            this.permissions[role] = {};
        }
        if (!this.permissions[role][resource]) {
            this.permissions[role][resource] = [];
        }
        if (!this.permissions[role][resource].includes(action)) {
            this.permissions[role][resource].push(action);
            this.savePermissions();
        }
    }

    /**
     * Remove permission from role
     */
    removePermission(role, resource, action) {
        if (this.permissions[role] && this.permissions[role][resource]) {
            this.permissions[role][resource] = this.permissions[role][resource].filter(a => a !== action);
            this.savePermissions();
        }
    }

    /**
     * Check if user can perform action
     */
    canUserPerformAction(user, resource, action) {
        if (!user) return false;
        return this.hasPermission(user.role, resource, action);
    }

    /**
     * Render permissions matrix
     */
    renderPermissionsMatrix() {
        const resources = ['users', 'requests', 'orders', 'products', 'categories', 'reports', 'settings', 'audit', 'permissions'];
        const actions = ['create', 'read', 'update', 'delete', 'export'];
        const roles = ['admin', 'employee', 'technician', 'customer'];

        return `
            <div class="permissions-matrix glass-card" style="padding: 1.5rem;">
                <h3 style="margin-bottom: 1.5rem;">Permissions Matrix</h3>
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Resource</th>
                                ${roles.map(role => `<th>${role.charAt(0).toUpperCase() + role.slice(1)}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${resources.map(resource => `
                                <tr>
                                    <td style="font-weight: 600;">${resource.charAt(0).toUpperCase() + resource.slice(1)}</td>
                                    ${roles.map(role => `
                                        <td>
                                            <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                                                ${this.getPermissionsForRole(role)[resource]?.map(action => `
                                                    <span class="status-badge status-ready" style="font-size: 0.75rem;">${action}</span>
                                                `).join('') || '<span style="color: #64748b; font-size: 0.875rem;">None</span>'}
                                            </div>
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render role permissions editor
     */
    renderRolePermissionsEditor(role) {
        const rolePermissions = this.getPermissionsForRole(role);
        const resources = ['users', 'requests', 'orders', 'products', 'categories', 'reports', 'settings', 'audit', 'permissions'];
        const actions = ['create', 'read', 'update', 'delete', 'export'];

        return `
            <div class="role-permissions-editor glass-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3>Edit ${role.charAt(0).toUpperCase() + role.slice(1)} Permissions</h3>
                    <button class="btn btn-primary" onclick="permissionsManager.saveRolePermissions('${role}')">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
                <div style="display: grid; gap: 1rem;">
                    ${resources.map(resource => `
                        <div style="padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <h4 style="margin-bottom: 0.75rem;">${resource.charAt(0).toUpperCase() + resource.slice(1)}</h4>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                ${actions.map(action => `
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                        <input type="checkbox" 
                                               name="${resource}_${action}" 
                                               ${rolePermissions[resource]?.includes(action) ? 'checked' : ''}
                                               value="${action}">
                                        <span>${action.charAt(0).toUpperCase() + action.slice(1)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Save role permissions from form
     */
    saveRolePermissions(role) {
        const resources = ['users', 'requests', 'orders', 'products', 'categories', 'reports', 'settings', 'audit', 'permissions'];
        const actions = ['create', 'read', 'update', 'delete', 'export'];

        resources.forEach(resource => {
            const permissions = [];
            actions.forEach(action => {
                const checkbox = document.querySelector(`input[name="${resource}_${action}"]`);
                if (checkbox && checkbox.checked) {
                    permissions.push(action);
                }
            });
            this.updateRolePermissions(role, resource, permissions);
        });

        toast.success('Permissions updated successfully!');
    }

    /**
     * Render permissions dashboard
     */
    renderPermissionsDashboard() {
        return `
            <div class="permissions-dashboard">
                <div class="dashboard-header">
                    <h2>Permissions Management</h2>
                </div>

                <div style="display: grid; gap: 1rem; margin-bottom: 2rem;">
                    <div style="display: flex; gap: 0.5rem;">
                        ${['admin', 'employee', 'technician', 'customer'].map(role => `
                            <button class="btn btn-secondary" onclick="permissionsManager.showRoleEditor('${role}')">
                                <i class="fas fa-user-shield"></i> ${role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div id="permissionsContent">
                    ${this.renderPermissionsMatrix()}
                </div>
            </div>
        `;
    }

    /**
     * Show role editor
     */
    showRoleEditor(role) {
        const content = this.renderRolePermissionsEditor(role);
        document.getElementById('permissionsContent').innerHTML = content;
    }

    /**
     * Get user-specific permissions (for custom user permissions)
     */
    getUserPermissions(userId) {
        const userPermissions = storage.get('userPermissions') || {};
        return userPermissions[userId] || null;
    }

    /**
     * Set user-specific permissions
     */
    setUserPermissions(userId, permissions) {
        const userPermissions = storage.get('userPermissions') || {};
        userPermissions[userId] = permissions;
        storage.set('userPermissions', userPermissions);
    }

    /**
     * Check if user has custom permissions
     */
    hasCustomPermissions(userId) {
        return this.getUserPermissions(userId) !== null;
    }

    /**
     * Get effective permissions for user (role + custom)
     */
    getEffectivePermissions(user) {
        if (this.hasCustomPermissions(user.id)) {
            return this.getUserPermissions(user.id);
        }
        return this.getPermissionsForRole(user.role);
    }

    /**
     * Render user permissions editor
     */
    renderUserPermissionsEditor(userId) {
        const user = storage.getUserById(userId);
        if (!user) return '<p>User not found</p>';

        const customPermissions = this.getUserPermissions(userId);
        const rolePermissions = this.getPermissionsForRole(user.role);
        const effectivePermissions = customPermissions || rolePermissions;

        const resources = ['users', 'requests', 'orders', 'products', 'categories', 'reports', 'settings', 'audit', 'permissions'];
        const actions = ['create', 'read', 'update', 'delete', 'export'];

        return `
            <div class="user-permissions-editor glass-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div>
                        <h3>Edit User Permissions</h3>
                        <p style="color: #94a3b8; font-size: 0.875rem;">${user.name} (${user.role})</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="permissionsManager.resetToRole('${userId}', '${user.role}')">
                            <i class="fas fa-undo"></i> Reset to Role
                        </button>
                        <button class="btn btn-primary" onclick="permissionsManager.saveUserPermissions('${userId}')">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" id="useCustomPermissions" ${customPermissions ? 'checked' : ''}>
                        <span>Use custom permissions (override role defaults)</span>
                    </label>
                </div>

                <div style="display: grid; gap: 1rem;">
                    ${resources.map(resource => `
                        <div style="padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <h4 style="margin-bottom: 0.75rem;">${resource.charAt(0).toUpperCase() + resource.slice(1)}</h4>
                            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                ${actions.map(action => `
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                        <input type="checkbox" 
                                               name="${resource}_${action}" 
                                               ${effectivePermissions[resource]?.includes(action) ? 'checked' : ''}
                                               value="${action}">
                                        <span>${action.charAt(0).toUpperCase() + action.slice(1)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Save user permissions
     */
    saveUserPermissions(userId) {
        const useCustom = document.getElementById('useCustomPermissions').checked;
        
        if (!useCustom) {
            const user = storage.getUserById(userId);
            this.setUserPermissions(userId, null);
            toast.success('Permissions reset to role defaults');
            return;
        }

        const resources = ['users', 'requests', 'orders', 'products', 'categories', 'reports', 'settings', 'audit', 'permissions'];
        const actions = ['create', 'read', 'update', 'delete', 'export'];

        const permissions = {};
        resources.forEach(resource => {
            permissions[resource] = [];
            actions.forEach(action => {
                const checkbox = document.querySelector(`input[name="${resource}_${action}"]`);
                if (checkbox && checkbox.checked) {
                    permissions[resource].push(action);
                }
            });
        });

        this.setUserPermissions(userId, permissions);
        toast.success('Custom permissions saved!');
    }

    /**
     * Reset user permissions to role defaults
     */
    resetToRole(userId, role) {
        this.setUserPermissions(userId, null);
        toast.success('Permissions reset to role defaults');
        
        // Refresh editor
        const editor = document.querySelector('.user-permissions-editor');
        if (editor) {
            editor.outerHTML = this.renderUserPermissionsEditor(userId);
        }
    }

    /**
     * Get permission statistics
     */
    getStatistics() {
        const stats = {
            totalRoles: Object.keys(this.permissions).length,
            totalResources: Object.keys(this.permissions.admin || {}).length,
            usersWithCustomPermissions: 0,
            permissionDistribution: {}
        };

        const userPermissions = storage.get('userPermissions') || {};
        stats.usersWithCustomPermissions = Object.keys(userPermissions).length;

        // Count permissions by resource
        for (const role in this.permissions) {
            for (const resource in this.permissions[role]) {
                if (!stats.permissionDistribution[resource]) {
                    stats.permissionDistribution[resource] = 0;
                }
                stats.permissionDistribution[resource] += this.permissions[role][resource].length;
            }
        }

        return stats;
    }
}

// Create global instance
const permissionsManager = new PermissionsManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    permissionsManager.init();
});
