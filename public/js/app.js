/**
 * YAS Laptop Service Center - Main Application
 * Shared utilities and functionality
 */

// Utility Functions
class Utils {
    /**
     * Format date to readable string with Arabic day name
     */
    static formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        
        // Arabic day names
        const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                             'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        const dayName = arabicDays[date.getDay()];
        const day = date.getDate();
        const month = arabicMonths[date.getMonth()];
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${dayName}، ${day} ${month} ${year} - ${hours}:${minutes}`;
    }

    /**
     * Format date to simple Arabic format (day/month/year)
     */
    static formatDateSimple(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '—';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
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
     * Share on Facebook
     */
    static shareOnFacebook() {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent('مركز YAS لصيانة اللابتوب - صيانة احترافية لجميع أنواع اللابتوب');
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`, '_blank', 'width=600,height=400');
    }

    /**
     * Share on Twitter
     */
    static shareOnTwitter() {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('مركز YAS لصيانة اللابتوب - صيانة احترافية لجميع أنواع اللابتوب');
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
    }

    /**
     * Share on WhatsApp
     */
    static shareOnWhatsApp() {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent('مركز YAS لصيانة اللابتوب - صيانة احترافية لجميع أنواع اللابتوب');
        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
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

// Global share functions
window.shareOnFacebook = () => Utils.shareOnFacebook();
window.shareOnTwitter = () => Utils.shareOnTwitter();
window.shareOnWhatsApp = () => Utils.shareOnWhatsApp();

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

    // Mobile menu toggle functionality is now in mobile-menu.js
    
    // Sidebar toggle for dashboard
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Initialize global search
    initGlobalSearch();
});

/**
 * Initialize global search functionality
 */
function initGlobalSearch() {
    const globalSearchForm = document.getElementById('globalSearchForm');
    const globalSearchInput = document.getElementById('globalSearchInput');
    const globalSearchSuggestions = document.getElementById('globalSearchSuggestions');
    const globalSearchResults = document.getElementById('globalSearchResults');

    if (!globalSearchForm || !globalSearchInput) return;

    let debounceTimer;

    // Instant search with debounce
    globalSearchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const searchInput = e.target.value.trim();

        if (searchInput.length < 2) {
            globalSearchSuggestions.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(() => {
            showGlobalSearchSuggestions(searchInput);
        }, 300);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!globalSearchInput.contains(e.target) && !globalSearchSuggestions.contains(e.target)) {
            globalSearchSuggestions.style.display = 'none';
        }
    });

    // Form submission
    globalSearchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const searchInput = globalSearchInput.value.trim();
        
        if (!searchInput) {
            toast.error('يرجى إدخال كلمة البحث');
            return;
        }

        loading.show('جاري البحث...');

        try {
            const results = await performGlobalSearch(searchInput);
            displayGlobalSearchResults(results);
            loading.hide();
        } catch (error) {
            loading.hide();
            console.error('Global search error:', error);
            toast.error('حدث خطأ أثناء البحث');
        }
    });
}

/**
 * Show global search suggestions
 */
async function showGlobalSearchSuggestions(searchInput) {
    const globalSearchSuggestions = document.getElementById('globalSearchSuggestions');
    if (!globalSearchSuggestions) return;

    // Don't show suggestions for multi-term searches
    const searchTerms = searchInput.split(/[،;,]/).map(term => term.trim()).filter(term => term.length > 0);
    if (searchTerms.length > 1) {
        globalSearchSuggestions.style.display = 'none';
        return;
    }

    try {
        const results = await performGlobalSearch(searchInput);
        const allResults = [
            ...results.requests.map(r => ({ ...r, type: 'طلب عادي', typeEn: 'single' })),
            ...results.bulkRequests.map(r => ({ ...r, type: 'طلب جملة', typeEn: 'bulk' })),
            ...results.companyRequests.map(r => ({ ...r, type: 'موظفي شركة', typeEn: 'company' }))
        ];

        if (allResults.length > 0) {
            globalSearchSuggestions.innerHTML = allResults.slice(0, 5).map(r => `
                <div class="search-suggestion-item" data-value="${r.requestNumber || r.request_number}" data-type="${r.typeEn}">
                    <div class="suggestion-type">${r.type}</div>
                    <div class="suggestion-value">${r.requestNumber || r.request_number} - ${r.fullName || r.full_name || r.customerName || r.companyName || ''}</div>
                </div>
            `).join('');

            globalSearchSuggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById('globalSearchInput').value = item.dataset.value;
                    globalSearchSuggestions.style.display = 'none';
                    document.getElementById('globalSearchForm').dispatchEvent(new Event('submit'));
                });
            });

            globalSearchSuggestions.style.display = 'block';
        } else {
            globalSearchSuggestions.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        globalSearchSuggestions.style.display = 'none';
    }
}

/**
 * Perform global search across all request types with enhanced capabilities
 * Supports multiple search terms separated by commas or semicolons
 * Uses optimized server-side search API
 */
async function performGlobalSearch(searchInput) {
    const searchTerms = searchInput
        .split(/[،;,]/) // Split by Arabic comma, English comma, or semicolon
        .map(term => term.toLowerCase().trim())
        .filter(term => term.length > 0);

    if (searchTerms.length === 0) {
        return { requests: [], bulkRequests: [], companyRequests: [] };
    }

    console.log('🔍 Multi-term search:', searchTerms);

    try {
        // Search for each term and combine results
        const allResults = {
            requests: [],
            bulkRequests: [],
            companyRequests: []
        };

        for (const searchTerm of searchTerms) {
            // Use the optimized search API endpoint
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
            
            if (!response.ok) {
                throw new Error('Search API request failed');
            }

            const results = await response.json();
            
            // Add results with matched term tracking
            allResults.requests.push(...results.requests.map(r => ({ ...r, matchedTerm: searchTerm })));
            allResults.bulkRequests.push(...results.bulkRequests.map(r => ({ ...r, matchedTerm: searchTerm })));
            allResults.companyRequests.push(...results.companyRequests.map(r => ({ ...r, matchedTerm: searchTerm })));
        }

        // Remove duplicates based on request number and type
        const removeDuplicates = (arr) => {
            const seen = new Set();
            return arr.filter(item => {
                const key = `${item.requestNumber || item.request_number}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    return true;
                }
                return false;
            });
        };

        return {
            requests: removeDuplicates(allResults.requests),
            bulkRequests: removeDuplicates(allResults.bulkRequests),
            companyRequests: removeDuplicates(allResults.companyRequests)
        };
    } catch (error) {
        console.error('Error using search API, falling back to client-side search:', error);
        
        // Fallback to client-side search if API fails
        const allResults = {
            requests: [],
            bulkRequests: [],
            companyRequests: []
        };

        for (const searchTerm of searchTerms) {
            const [requestsRes, bulkRequestsRes, companyRequestsRes] = await Promise.all([
                fetch('/api/requests').then(r => r.json()).catch(() => []),
                fetch('/api/bulk-requests').then(r => r.json()).catch(() => []),
                fetch('/api/company-requests').then(r => r.json()).catch(() => [])
            ]);

            const searchTermLower = searchTerm.toLowerCase();

            // Search in regular requests - enhanced with more fields
            const requests = requestsRes.filter(r => {
                return (r.serialNumber || r.serial_number || '').toLowerCase().includes(searchTermLower) ||
                       (r.fullName || r.full_name || '').toLowerCase().includes(searchTermLower) ||
                       (r.requestNumber || r.request_number || '').toLowerCase().includes(searchTermLower) ||
                       (r.phone || '').includes(searchTerm) ||
                       (r.email || '').toLowerCase().includes(searchTermLower) ||
                       (r.laptopBrand || r.laptop_brand || '').toLowerCase().includes(searchTermLower) ||
                       (r.laptopModel || r.laptop_model || '').toLowerCase().includes(searchTermLower) ||
                       (r.status || '').toLowerCase().includes(searchTermLower) ||
                       (r.priority || '').toLowerCase().includes(searchTermLower);
            }).map(r => ({ ...r, matchedTerm: searchTerm }));

            // Search in bulk requests - enhanced with device-level search
            const bulkRequests = bulkRequestsRes.filter(r => {
                const devices = r.devices || [];
                const hasMatchingSerial = devices.some(d => 
                    (d.serialNumber || d.serial_number || '').toLowerCase().includes(searchTermLower) ||
                    (d.laptopBrand || d.laptop_brand || '').toLowerCase().includes(searchTermLower) ||
                    (d.laptopModel || d.laptop_model || '').toLowerCase().includes(searchTermLower)
                );
                return hasMatchingSerial ||
                       (r.customerName || '').toLowerCase().includes(searchTermLower) ||
                       (r.requestNumber || '').toLowerCase().includes(searchTermLower) ||
                       (r.customerPhone || '').includes(searchTerm) ||
                       (r.customerEmail || '').toLowerCase().includes(searchTermLower) ||
                       (r.status || '').toLowerCase().includes(searchTermLower) ||
                       (r.priority || '').toLowerCase().includes(searchTermLower);
            }).map(r => ({ ...r, matchedTerm: searchTerm }));

            // Search in company requests - enhanced with more fields
            const companyRequests = companyRequestsRes.filter(r => {
                return (r.serialNumber || r.serial_number || '').toLowerCase().includes(searchTermLower) ||
                       (r.fullName || r.full_name || r.companyName || r.company_name || '').toLowerCase().includes(searchTermLower) ||
                       (r.requestNumber || r.request_number || '').toLowerCase().includes(searchTermLower) ||
                       (r.phone || r.companyPhone || r.company_phone || '').includes(searchTerm) ||
                       (r.laptopBrand || r.laptop_brand || '').toLowerCase().includes(searchTermLower) ||
                       (r.laptopModel || r.laptop_model || '').toLowerCase().includes(searchTermLower) ||
                       (r.status || '').toLowerCase().includes(searchTermLower) ||
                       (r.priority || '').toLowerCase().includes(searchTermLower);
            }).map(r => ({ ...r, matchedTerm: searchTerm }));

            allResults.requests.push(...requests);
            allResults.bulkRequests.push(...bulkRequests);
            allResults.companyRequests.push(...companyRequests);
        }

        // Remove duplicates
        const removeDuplicates = (arr) => {
            const seen = new Set();
            return arr.filter(item => {
                const key = `${item.requestNumber || item.request_number}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    return true;
                }
                return false;
            });
        };

        return {
            requests: removeDuplicates(allResults.requests),
            bulkRequests: removeDuplicates(allResults.bulkRequests),
            companyRequests: removeDuplicates(allResults.companyRequests)
        };
    }
}

/**
 * Display global search results with enhanced UI and download button
 * Supports displaying results from multiple search terms
 */
function displayGlobalSearchResults(results) {
    const globalSearchResults = document.getElementById('globalSearchResults');
    const globalSearchResultsModal = document.getElementById('globalSearchResultsModal');
    if (!globalSearchResults) return;

    const allResults = [
        ...results.requests.map(r => ({ ...r, type: 'طلب عادي', typeEn: 'single' })),
        ...results.bulkRequests.map(r => ({ ...r, type: 'طلب جملة', typeEn: 'bulk' })),
        ...results.companyRequests.map(r => ({ ...r, type: 'موظفي شركة', typeEn: 'company' }))
    ];

    if (allResults.length === 0) {
        globalSearchResults.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted-more); margin-bottom: 1rem;"></i>
                <p style="color: var(--text-muted);">لم يتم العثور على نتائج</p>
            </div>
        `;
    } else {
        // Count results by type
        const counts = {
            single: results.requests.length,
            bulk: results.bulkRequests.length,
            company: results.companyRequests.length
        };

        // Check if we have matched terms (multi-term search)
        const hasMatchedTerms = allResults.some(r => r.matchedTerm);
        
        // Get unique search terms
        const searchTerms = [...new Set(allResults.map(r => r.matchedTerm).filter(Boolean))];
        
        // Build search terms summary if multiple terms were used
        let searchTermsSummary = '';
        if (searchTerms.length > 1) {
            searchTermsSummary = `
                <div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
                    <p style="color: #3b82f6; margin: 0; font-size: 0.875rem;">
                        <i class="fas fa-layer-group"></i> البحث بأكثر من كلمة:
                        ${searchTerms.map(term => `<span style="margin-right: 0.5rem; background: rgba(59, 130, 246, 0.2); padding: 0.25rem 0.5rem; border-radius: 4px;">"${term}"</span>`).join('')}
                    </p>
                </div>
            `;
        }

        globalSearchResults.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <p style="color: var(--text-muted); margin: 0;">
                    <i class="fas fa-search"></i> تم العثور على ${allResults.length} نتيجة
                    <span style="margin-right: 0.5rem;">(عادي: ${counts.single} | جملة: ${counts.bulk} | شركة: ${counts.company})</span>
                </p>
                <button onclick="downloadSearchResultsToExcel()" style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
                    <i class="fas fa-file-excel"></i> تحميل Excel
                </button>
            </div>
            ${searchTermsSummary}
            <div class="search-results-grid">
                ${allResults.map(r => `
                    <div class="glass-card" style="padding: 1rem; margin-bottom: 1rem; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.3s ease;" onclick="handleSearchResultClick('${r.typeEn}', '${r.requestNumber || r.request_number}')" onmouseover="this.style.borderColor='rgba(59, 130, 246, 0.5)'" onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.1)'">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="font-weight: 600; color: #3b82f6;">${r.requestNumber || r.request_number}</span>
                            <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: ${
                                r.typeEn === 'single' ? 'rgba(16, 185, 129, 0.2); color: #10b981;' :
                                r.typeEn === 'bulk' ? 'rgba(245, 158, 11, 0.2); color: #f59e0b;' :
                                'rgba(139, 92, 246, 0.2); color: #8b5cf6;'
                            }; border-radius: 4px;">${r.type}</span>
                        </div>
                        <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
                            <i class="fas fa-user"></i> ${r.fullName || r.full_name || r.customerName || r.companyName || ''}
                        </p>
                        <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
                            <i class="fas fa-phone"></i> ${r.phone || r.customerPhone || r.companyPhone || ''}
                        </p>
                        ${r.serialNumber || r.serial_number ? `
                            <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
                                <i class="fas fa-barcode"></i> ${r.serialNumber || r.serial_number}
                            </p>
                        ` : ''}
                        ${r.laptopBrand || r.laptop_brand ? `
                            <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
                                <i class="fas fa-laptop"></i> ${r.laptopBrand || r.laptop_brand} ${r.laptopModel || r.laptop_model ? `- ${r.laptopModel || r.laptop_model}` : ''}
                            </p>
                        ` : ''}
                        ${hasMatchedTerms && r.matchedTerm ? `
                            <p style="color: var(--text-muted); margin-bottom: 0.5rem;">
                                <i class="fas fa-tag"></i> <span style="background: rgba(59, 130, 246, 0.2); color: #3b82f6; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${r.matchedTerm}</span>
                            </p>
                        ` : ''}
                        <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.875rem; color: var(--text-muted);">
                                <i class="fas fa-clock"></i> ${Utils.formatDate(r.createdAt || r.created_at)}
                            </span>
                            <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: rgba(59, 130, 246, 0.1); border-radius: 4px; color: #3b82f6;">
                                ${r.status || 'غير محدد'}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Show modal
    if (globalSearchResultsModal) {
        globalSearchResultsModal.style.display = 'block';
    }
}

/**
 * Handle search result click
 */
function handleSearchResultClick(type, requestNumber) {
    const modal = document.getElementById('globalSearchResultsModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Navigate to appropriate section
    if (type === 'single') {
        if (typeof adminManager !== 'undefined') {
            adminManager.switchSection('requests');
            // Set search filter
            setTimeout(() => {
                const searchInput = document.getElementById('requestSearch');
                if (searchInput) {
                    searchInput.value = requestNumber;
                    searchInput.dispatchEvent(new Event('input'));
                }
            }, 100);
        }
    } else if (type === 'bulk') {
        if (typeof adminManager !== 'undefined') {
            adminManager.switchSection('bulk-requests');
            setTimeout(() => {
                const searchInput = document.getElementById('bulkSearchInput');
                if (searchInput) {
                    searchInput.value = requestNumber;
                    searchInput.dispatchEvent(new Event('input'));
                }
            }, 100);
        }
    } else if (type === 'company') {
        if (typeof adminManager !== 'undefined') {
            adminManager.switchSection('company-requests');
            setTimeout(() => {
                const searchInput = document.getElementById('companySearchInput');
                if (searchInput) {
                    searchInput.value = requestNumber;
                    searchInput.dispatchEvent(new Event('input'));
                }
            }, 100);
        }
    }
}

/**
 * Download search results to Excel with enhanced formatting
 */
function downloadSearchResultsToExcel() {
    // Get current search results from the displayed content
    const resultsContainer = document.getElementById('globalSearchResults');
    if (!resultsContainer) {
        toast.error('لا توجد نتائج للتحميل');
        return;
    }

    try {
        // Collect all result cards from the UI
        const resultCards = resultsContainer.querySelectorAll('.glass-card');
        if (resultCards.length === 0) {
            toast.warning('لا توجد نتائج للتحميل');
            return;
        }

        // Extract data from each card
        const excelData = [];
        resultCards.forEach(card => {
            const typeBadge = card.querySelector('span[style*="border-radius: 4px"]');
            const requestNumber = card.querySelector('span[style*="font-weight: 600"]');
            const name = card.querySelector('p i.fa-user')?.parentElement;
            const phone = card.querySelector('p i.fa-phone')?.parentElement;
            const serial = card.querySelector('p i.fa-barcode')?.parentElement;
            const laptop = card.querySelector('p i.fa-laptop')?.parentElement;
            const date = card.querySelector('p i.fa-clock')?.parentElement;
            const status = card.querySelectorAll('span[style*="border-radius: 4px"]')[1];

            excelData.push({
                'نوع الطلب': typeBadge?.textContent?.trim() || 'غير محدد',
                'رقم الطلب': requestNumber?.textContent?.trim() || '',
                'الاسم': name?.textContent?.replace('👤', '').trim() || '',
                'الهاتف': phone?.textContent?.replace('📱', '').trim() || '',
                'الرقم التسلسلي': serial?.textContent?.replace('🔢', '').trim() || '',
                'الماركة والموديل': laptop?.textContent?.replace('💻', '').trim() || '',
                'الحالة': status?.textContent?.trim() || 'غير محدد',
                'التاريخ': date?.textContent?.replace('🕐', '').trim() || ''
            });
        });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 }, // نوع الطلب
            { wch: 20 }, // رقم الطلب
            { wch: 25 }, // الاسم
            { wch: 15 }, // الهاتف
            { wch: 20 }, // الرقم التسلسلي
            { wch: 25 }, // الماركة والموديل
            { wch: 15 }, // الحالة
            { wch: 15 }  // التاريخ
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'نتائج البحث الشامل');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `بحث_شامل_${timestamp}.xlsx`;

        // Download file
        XLSX.writeFile(wb, filename);

        toast.success(`تم تحميل ${excelData.length} نتيجة في ملف Excel بنجاح`);
    } catch (error) {
        console.error('Error downloading Excel:', error);
        toast.error('فشل تحميل ملف Excel');
    }
}

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
