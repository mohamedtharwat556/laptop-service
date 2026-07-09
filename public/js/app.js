/**
 * YAS Laptop Service Center - Main Application
 * Shared utilities and functionality
 */

// Utility Functions
class Utils {
    /**
     * Format date to readable string
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Format currency
     */
    static formatCurrency(amount) {
        return '$' + amount.toFixed(2);
    }

    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Generate random color
     */
    static randomColor() {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Validate email
     */
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validate phone number
     */
    static validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]{10,}$/;
        return re.test(phone);
    }

    /**
     * Escape HTML to prevent XSS
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Toast Notification System
class ToastManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${Utils.escapeHtml(message)}</span>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Modal System
class ModalManager {
    constructor() {
        this.modals = {};
    }

    create(id, title, content, onConfirm = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = `modal-${id}`;
        
        modal.innerHTML = `
            <div class="modal-content" dir="rtl" style="text-align: right;">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="modalManager.close('${id}')">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${onConfirm ? `
                    <div class="modal-footer" style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-start;">
                        <button class="btn btn-primary" onclick="modalManager.confirm('${id}')">تأكيد</button>
                        <button class="btn btn-secondary" onclick="modalManager.close('${id}')">إلغاء</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modals[id] = { modal, onConfirm };
        
        return modal;
    }

    open(id) {
        const modalData = this.modals[id];
        if (modalData) {
            modalData.modal.classList.add('active');
        }
    }

    close(id) {
        const modalData = this.modals[id];
        if (modalData) {
            modalData.modal.classList.remove('active');
        }
    }

    confirm(id) {
        const modalData = this.modals[id];
        if (modalData && modalData.onConfirm) {
            modalData.onConfirm();
        }
        this.close(id);
    }

    destroy(id) {
        const modalData = this.modals[id];
        if (modalData) {
            modalData.modal.remove();
            delete this.modals[id];
        }
    }
}

// Loading Spinner
class LoadingManager {
    constructor() {
        this.container = null;
    }

    show(message = 'Loading...') {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'loading-overlay';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            flex-direction: column;
            gap: 1rem;
        `;
        
        this.container.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        
        document.body.appendChild(this.container);
        document.body.style.overflow = 'hidden';
    }

    hide() {
        if (this.container) {
            this.container.remove();
            this.container = null;
            document.body.style.overflow = '';
        }
    }
}

// Form Validation
class FormValidator {
    constructor(form) {
        this.form = form;
        this.rules = {};
        this.errors = {};
    }

    addRule(fieldName, rule) {
        if (!this.rules[fieldName]) {
            this.rules[fieldName] = [];
        }
        this.rules[fieldName].push(rule);
    }

    validate() {
        this.errors = {};
        let isValid = true;
        
        for (const fieldName in this.rules) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (!field) continue;
            
            const value = field.value.trim();
            
            for (const rule of this.rules[fieldName]) {
                const result = rule(value, field);
                if (result !== true) {
                    this.errors[fieldName] = result;
                    isValid = false;
                    break;
                }
            }
        }
        
        this.displayErrors();
        return isValid;
    }

    displayErrors() {
        // Clear existing errors
        this.form.querySelectorAll('.error-message').forEach(el => el.remove());
        this.form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
            el.style.borderColor = '';
        });
        
        // Display new errors
        for (const fieldName in this.errors) {
            const field = this.form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.style.borderColor = '#ef4444';
                
                const errorEl = document.createElement('div');
                errorEl.className = 'error-message';
                errorEl.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 0.25rem;';
                errorEl.textContent = this.errors[fieldName];
                field.parentNode.appendChild(errorEl);
            }
        }
    }

    static required(message = 'This field is required') {
        return (value) => {
            return value ? true : message;
        };
    }

    static minLength(min, message) {
        return (value) => {
            return value.length >= min ? true : message || `Minimum ${min} characters required`;
        };
    }

    static maxLength(max, message) {
        return (value) => {
            return value.length <= max ? true : message || `Maximum ${max} characters allowed`;
        };
    }

    static email(message = 'Invalid email address') {
        return (value) => {
            return Utils.validateEmail(value) ? true : message;
        };
    }

    static phone(message = 'Invalid phone number') {
        return (value) => {
            return Utils.validatePhone(value) ? true : message;
        };
    }

    static pattern(regex, message) {
        return (value) => {
            return regex.test(value) ? true : message;
        };
    }
}

// Dark Mode Toggle
class DarkModeManager {
    constructor() {
        this.isDarkMode = localStorage.getItem('YAS_darkMode') !== 'false';
        this.init();
    }

    init() {
        this.applyMode();
        this.createToggle();
    }

    createToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'dark-mode-toggle';
        toggle.innerHTML = this.isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
        toggle.onclick = () => this.toggle();
        
        const navbar = document.querySelector('.nav-container');
        if (navbar) {
            navbar.appendChild(toggle);
        }
    }

    toggle() {
        this.isDarkMode = !this.isDarkMode;
        localStorage.setItem('YAS_darkMode', this.isDarkMode);
        this.applyMode();
        this.updateToggleIcon();
    }

    applyMode() {
        if (this.isDarkMode) {
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
        }
    }

    updateToggleIcon() {
        const toggle = document.querySelector('.dark-mode-toggle');
        if (toggle) {
            toggle.innerHTML = this.isDarkMode ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
        }
    }
}

// Search and Filter
class SearchManager {
    constructor(data, options = {}) {
        this.data = data;
        this.options = {
            searchFields: options.searchFields || [],
            filterField: options.filterField || null,
            sortField: options.sortField || null,
            sortOrder: options.sortOrder || 'asc',
            ...options
        };
    }

    search(query) {
        if (!query) return this.data;
        
        const lowerQuery = query.toLowerCase();
        return this.data.filter(item => {
            return this.options.searchFields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(lowerQuery);
            });
        });
    }

    filter(value) {
        if (!value || !this.options.filterField) return this.data;
        
        return this.data.filter(item => {
            return item[this.options.filterField] === value;
        });
    }

    sort(field, order = 'asc') {
        const sorted = [...this.data];
        sorted.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sorted;
    }

    paginate(data, page = 1, perPage = 10) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        
        return {
            data: data.slice(start, end),
            total: data.length,
            pages: Math.ceil(data.length / perPage),
            currentPage: page
        };
    }
}

// Pagination UI
class PaginationUI {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onPageChange: options.onPageChange || (() => {}),
            ...options
        };
        this.currentPage = 1;
        this.totalPages = 1;
    }

    render(currentPage, totalPages) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        
        this.container.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => this.goToPage(currentPage - 1);
        pagination.appendChild(prevBtn);
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.classList.toggle('active', i === currentPage);
            pageBtn.onclick = () => this.goToPage(i);
            pagination.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => this.goToPage(currentPage + 1);
        pagination.appendChild(nextBtn);
        
        this.container.appendChild(pagination);
    }

    goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
            this.options.onPageChange(page);
        }
    }
}

// Initialize global instances
const toast = new ToastManager();
const modalManager = new ModalManager();
const loading = new LoadingManager();
const darkMode = new DarkModeManager();

// Application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode
    if (!document.querySelector('.dark-mode-toggle')) {
        darkMode.createToggle();
    }
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenuToggle && navLinks && 
            !mobileMenuToggle.contains(e.target) && 
            !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
    
    // Sidebar toggle for dashboard
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Utils,
        ToastManager,
        ModalManager,
        LoadingManager,
        FormValidator,
        DarkModeManager,
        SearchManager,
        PaginationUI
    };
}
