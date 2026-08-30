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
        this.bulkRequests = [];
        this.companyRequests = [];
        this.charts = {};
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.autoRefreshInterval = null;
        this.lastSeenRequestId = parseInt(localStorage.getItem('lastSeenRequestId') || '0');
        this.lastSeenBulkRequestId = parseInt(localStorage.getItem('lastSeenBulkRequestId') || '0');
        this.lastSeenCompanyRequestId = parseInt(localStorage.getItem('lastSeenCompanyRequestId') || '0');
        this.newRequestNotifications = [];
        this.unreadNotifications = JSON.parse(localStorage.getItem('unreadNotifications') || '[]');
    }

    /**
     * Initialize admin dashboard
     */
    async init() {
        try {
            console.log('🔄 AdminManager.init() called');
            
            // Always check if user is already set in sessionStorage
            let user = sessionStorage.getItem('YAS_currentUser');
            if (user) {
                try {
                    this.currentUser = JSON.parse(user);
                    console.log('✅ User loaded from sessionStorage:', this.currentUser.name);
                } catch (e) {
                    console.error('Failed to parse user:', e);
                }
            }
            
            // If still no user, try isAuthenticated
            if (!this.currentUser) {
                if (this.isAuthenticated()) {
                    console.log('✅ User authenticated via isAuthenticated()');
                } else {
                    console.warn('⚠️  User not authenticated, but continuing in development mode');
                    // In development, create a default user
                    this.currentUser = {
                        id: 1,
                        username: 'admin',
                        password: 'admin123',
                        role: 'admin',
                        name: 'System Administrator',
                        email: 'admin@yas.com'
                    };
                }
            }
            
            if (!this.currentUser || this.currentUser.role !== 'admin') {
                console.error('❌ User not authenticated as admin');
                window.location.href = 'index.html';
                return;
            }

            console.log('📊 Loading data...');
            await this.loadData();
            console.log('✅ Data loaded successfully');
            
            console.log('📑 Switching to dashboard section...');
            await this.switchSection('dashboard');
            
            console.log('🔄 Starting auto-refresh...');
            this.startAutoRefresh();
            
            console.log('� Initializing notification badge...');
            this.updateNotificationBadge();
            
            // Close notification dropdown when clicking outside
            document.addEventListener('click', (e) => {
                const dropdown = document.getElementById('notificationDropdown');
                const notificationBtn = document.getElementById('notificationBtn');
                if (dropdown && notificationBtn && !dropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                    dropdown.style.display = 'none';
                }
            });
            
            console.log('�🔗 Setting up sidebar navigation...');
            // Setup sidebar navigation
            document.querySelectorAll('.sidebar-nav-link').forEach(link => {
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const section = link.dataset.section;
                    await this.switchSection(section);
                    if (section === 'daily-report') {
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

            console.log('⏹️  Setting up logout button...');
            // Setup logout
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.logout());
            }

            console.log('🔍 Setting up search and filters...');
            // Setup search and filters
            const searchInput = document.getElementById('requestSearch');
            const statusFilter = document.getElementById('statusFilter');
            const brandFilter = document.getElementById('brandFilter');
            const priorityFilter = document.getElementById('priorityFilter');
            const dateFrom = document.getElementById('dateFrom');
            const dateTo = document.getElementById('dateTo');

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

            if (brandFilter) {
                brandFilter.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.renderRequests();
                });
            }

            if (priorityFilter) {
                priorityFilter.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.renderRequests();
                });
            }

            // Setup bulk requests search and filters
            const bulkSearchInput = document.getElementById('bulkSearchInput');
            const bulkStatusFilter = document.getElementById('bulkStatusFilter');

            if (bulkSearchInput) {
                bulkSearchInput.addEventListener('input', Utils.debounce(() => {
                    this.currentPage = 1;
                    this.renderBulkRequests();
                }, 300));
            }

            if (bulkStatusFilter) {
                bulkStatusFilter.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.renderBulkRequests();
                });
            }

            // Setup company requests search and filters
            const companySearchInput = document.getElementById('companySearchInput');
            const companyStatusFilter = document.getElementById('companyStatusFilter');

            if (companySearchInput) {
                companySearchInput.addEventListener('input', Utils.debounce(() => {
                    this.currentPage = 1;
                    this.renderCompanyRequests();
                }, 300));
            }

            if (companyStatusFilter) {
                companyStatusFilter.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.renderCompanyRequests();
                });
            }

            if (dateFrom) {
                dateFrom.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.renderRequests();
                });
            }

            if (dateTo) {
                dateTo.addEventListener('change', () => {
                    this.currentPage = 1;
                    this.renderRequests();
                });
            }
            
            console.log('✅ Admin dashboard initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing admin dashboard:', error);
            console.error('📋 Error message:', error.message);
            console.error('Stack:', error.stack);
            toast.error('فشل تحميل لوحة التحكم: ' + error.message);
        }
    }

    /**
     * Start auto-refresh every 10 seconds
     */
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        this.autoRefreshInterval = setInterval(async () => {
            const oldRequests = [...this.requests];
            const oldBulkRequests = [...this.bulkRequests];
            const oldCompanyRequests = [...this.companyRequests];
            await this.loadData();
            
            // Check for new requests
            this.checkForNewRequests(oldRequests);
            this.checkForNewBulkRequests(oldBulkRequests);
            this.checkForNewCompanyRequests(oldCompanyRequests);
            
            if (this.currentSection === 'dashboard') {
                this.renderStats();
                this.renderCharts();
            } else if (this.currentSection === 'requests') {
                this.renderRequests();
            } else if (this.currentSection === 'bulk-requests') {
                this.renderBulkRequests();
            } else if (this.currentSection === 'company-requests') {
                this.renderCompanyRequests();
            } else if (this.currentSection === 'users') {
                this.renderUsers();
            } else if (this.currentSection === 'products') {
                this.renderProductsManagement();
            } else if (this.currentSection === 'trash') {
                this.renderTrash();
            }
        }, 10000);
    }

    /**
     * Check for new requests and show notifications
     */
    checkForNewRequests(oldRequests) {
        const newRequests = this.requests.filter(r => r.id > this.lastSeenRequestId);
        
        if (newRequests.length > 0) {
            // Update last seen request ID
            const maxId = Math.max(...this.requests.map(r => r.id));
            this.lastSeenRequestId = maxId;
            localStorage.setItem('lastSeenRequestId', maxId.toString());
            
            // Add to unread notifications
            newRequests.forEach(request => {
                const notification = {
                    id: request.id,
                    type: 'new_request',
                    requestNumber: request.requestNumber,
                    fullName: request.fullName,
                    laptopBrand: request.laptopBrand,
                    laptopModel: request.laptopModel,
                    createdAt: new Date().toISOString(),
                    read: false
                };
                this.unreadNotifications.push(notification);
            });
            
            // Save to localStorage
            localStorage.setItem('unreadNotifications', JSON.stringify(this.unreadNotifications));
            
            // Update notification badge
            this.updateNotificationBadge();
            
            // Show toast notification
            this.showNewRequestToast(newRequests.length);
        }
    }

    /**
     * Check for new bulk requests and show notifications
     */
    checkForNewBulkRequests(oldBulkRequests) {
        const newBulkRequests = this.bulkRequests.filter(r => r.id > this.lastSeenBulkRequestId);
        
        if (newBulkRequests.length > 0) {
            // Update last seen bulk request ID
            const maxId = Math.max(...this.bulkRequests.map(r => r.id));
            this.lastSeenBulkRequestId = maxId;
            localStorage.setItem('lastSeenBulkRequestId', maxId.toString());
            
            // Add to unread notifications
            newBulkRequests.forEach(request => {
                const notification = {
                    id: request.id,
                    type: 'bulk_request',
                    requestNumber: request.requestNumber,
                    fullName: request.customerName,
                    laptopBrand: `طلب جملة (${request.deviceCount} لابتوب)`,
                    laptopModel: '',
                    createdAt: new Date().toISOString(),
                    read: false
                };
                this.unreadNotifications.push(notification);
            });
            
            // Save to localStorage
            localStorage.setItem('unreadNotifications', JSON.stringify(this.unreadNotifications));
            
            // Update notification badge
            this.updateNotificationBadge();
            
            // Show toast notification
            this.showBulkRequestToast(newBulkRequests.length);
        }
    }

    /**
     * Check for new company requests and show notifications
     */
    checkForNewCompanyRequests(oldCompanyRequests) {
        const newCompanyRequests = this.companyRequests.filter(r => r.id > this.lastSeenCompanyRequestId);
        
        if (newCompanyRequests.length > 0) {
            // Update last seen company request ID
            const maxId = Math.max(...this.companyRequests.map(r => r.id));
            this.lastSeenCompanyRequestId = maxId;
            localStorage.setItem('lastSeenCompanyRequestId', maxId.toString());
            
            // Add to unread notifications
            newCompanyRequests.forEach(request => {
                const notification = {
                    id: request.id,
                    type: 'company_request',
                    requestNumber: request.requestNumber,
                    fullName: request.fullName,
                    laptopBrand: request.laptopBrand,
                    laptopModel: request.laptopModel,
                    createdAt: new Date().toISOString(),
                    read: false
                };
                this.unreadNotifications.push(notification);
            });
            
            // Save to localStorage
            localStorage.setItem('unreadNotifications', JSON.stringify(this.unreadNotifications));
            
            // Update notification badge
            this.updateNotificationBadge();
            
            // Show toast notification
            this.showCompanyRequestToast(newCompanyRequests.length);
        }
    }

    /**
     * Show toast notification for new requests
     */
    showNewRequestToast(count) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.5s ease-out;
            cursor: pointer;
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="background: rgba(255, 255, 255, 0.2); border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-laptop" style="font-size: 1.5rem;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem;">🔔 ${count} لاب${count > 1 ? 'ات' : ''} جديد${count > 1 ? 'ة' : ''} واصل${count > 1 ? 'ة' : ''}!</div>
                    <div style="font-size: 0.875rem; opacity: 0.9;">اضغط لعرض الإشعارات</div>
                </div>
                <button onclick="event.stopPropagation(); this.closest('.notification-toast').remove();" style="background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; opacity: 0.7; padding: 0.25rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        toast.onclick = () => {
            this.toggleNotificationDropdown('request');
            toast.remove();
        };
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
        
        this.playNotificationSound();
    }

    /**
     * Show toast notification for new bulk requests
     */
    showBulkRequestToast(count) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            cursor: pointer;
            animation: slideIn 0.5s ease-out;
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 300px;
        `;
        
        toast.innerHTML = `
            <div style="font-size: 2rem;">📦</div>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem;">🔔 ${count} طلب جملة جديد${count > 1 ? 'ة' : ''}!</div>
                <div style="font-size: 0.875rem; opacity: 0.9;">اضغط لعرض الإشعارات</div>
            </div>
            <button onclick="event.stopPropagation(); this.closest('.notification-toast').remove();" style="background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; opacity: 0.7; padding: 0.25rem;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toast.onclick = () => {
            this.toggleNotificationDropdown('bulk');
            toast.remove();
        };
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
        
        this.playNotificationSound();
    }

    /**
     * Show toast notification for new company requests
     */
    showCompanyRequestToast(count) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            cursor: pointer;
            animation: slideIn 0.5s ease-out;
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 300px;
        `;
        
        toast.innerHTML = `
            <div style="font-size: 2rem;">🏢</div>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem;">🔔 ${count} طلب موظف جديد${count > 1 ? 'ة' : ''}!</div>
                <div style="font-size: 0.875rem; opacity: 0.9;">اضغط لعرض الإشعارات</div>
            </div>
            <button onclick="event.stopPropagation(); this.closest('.notification-toast').remove();" style="background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; opacity: 0.7; padding: 0.25rem;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toast.onclick = () => {
            this.toggleNotificationDropdown('company');
            toast.remove();
        };
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
        
        this.playNotificationSound();
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Could not play notification sound:', e);
        }
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const typeMap = {
            'request': 'new_request',
            'bulk': 'bulk_request',
            'company': 'company_request'
        };

        ['request', 'bulk', 'company'].forEach(type => {
            const badge = document.getElementById(`${type}NotificationBadge`);
            if (badge) {
                const unreadCount = this.unreadNotifications.filter(n => !n.read && n.type === typeMap[type]).length;
                badge.textContent = unreadCount;
                if (unreadCount > 0) {
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }

    /**
     * Toggle notification dropdown
     */
    toggleNotificationDropdown(type) {
        const dropdownId = `${type}NotificationDropdown`;
        const dropdown = document.getElementById(dropdownId);
        
        // Close all dropdowns first
        ['request', 'bulk', 'company'].forEach(t => {
            const d = document.getElementById(`${t}NotificationDropdown`);
            if (d) d.style.display = 'none';
        });
        
        if (dropdown) {
            dropdown.style.display = 'block';
            this.renderNotificationDropdown(type);
        }
    }

    /**
     * Render notification dropdown
     */
    renderNotificationDropdown(type) {
        const dropdownId = `${type}NotificationDropdown`;
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const typeMap = {
            'request': 'new_request',
            'bulk': 'bulk_request',
            'company': 'company_request'
        };

        const unreadNotifications = this.unreadNotifications.filter(n => !n.read && n.type === typeMap[type]);
        console.log(`🔔 ${type} notifications:`, unreadNotifications);
        
        if (unreadNotifications.length === 0) {
            dropdown.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: #94a3b8;">
                    <i class="fas fa-bell-slash" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                    <p>لا توجد إشعارات جديدة</p>
                </div>
            `;
            return;
        }

        dropdown.innerHTML = `
            <div style="max-height: 400px; overflow-y: auto;">
                ${unreadNotifications.reverse().map(notification => {
                    let icon, iconColor, bgColor;
                    if (notification.type === 'bulk_request') {
                        icon = 'fa-boxes';
                        iconColor = '#f59e0b';
                        bgColor = 'rgba(245, 158, 11, 0.2)';
                    } else if (notification.type === 'company_request') {
                        icon = 'fa-building';
                        iconColor = '#8b5cf6';
                        bgColor = 'rgba(139, 92, 246, 0.2)';
                    } else {
                        icon = 'fa-laptop';
                        iconColor = '#10b981';
                        bgColor = 'rgba(16, 185, 129, 0.2)';
                    }
                    return `
                    <div class="notification-item" style="padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); cursor: pointer; transition: background 0.2s;"
                         onclick="adminManager.openNotification(${notification.id})">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="background: ${bgColor}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
                                <i class="fas ${icon}" style="color: ${iconColor}; font-size: 1rem;"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size: 0.875rem; margin-bottom: 0.25rem;">${notification.fullName}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8;">${notification.laptopBrand} ${notification.laptopModel || ''}</div>
                                <div style="font-size: 0.7rem; color: #64748b; margin-top: 0.25rem;">رقم الطلب: ${notification.requestNumber}</div>
                            </div>
                            <div style="width: 8px; height: 8px; background: ${iconColor}; border-radius: 50%;"></div>
                        </div>
                    </div>
                `}).join('')}
            </div>
            <div style="padding: 0.75rem; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <button onclick="adminManager.markAllAsRead('${type}')" style="background: none; border: none; color: #3b82f6; cursor: pointer; font-size: 0.875rem; margin-right: 1rem;">
                    تعليم الكل كمقروء
                </button>
                <button onclick="adminManager.clearAllNotifications('${type}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.875rem;">
                    مسح جميع الإشعارات
                </button>
            </div>
        `;
    }

    /**
     * Open notification and navigate to request
     */
    openNotification(notificationId) {
        const notification = this.unreadNotifications.find(n => n.id === notificationId);
        console.log('🔔 Opening notification:', notification);
        if (notification) {
            // Mark as read
            notification.read = true;
            localStorage.setItem('unreadNotifications', JSON.stringify(this.unreadNotifications));
            
            // Update badge
            this.updateNotificationBadge();
            
            // Close dropdown
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) dropdown.style.display = 'none';
            
            // Determine the actual type by checking which array contains this ID
            let actualType = notification.type;
            if (this.bulkRequests.find(r => r.id === notificationId)) {
                actualType = 'bulk_request';
            } else if (this.companyRequests.find(r => r.id === notificationId)) {
                actualType = 'company_request';
            } else if (this.requests.find(r => r.id === notificationId)) {
                actualType = 'new_request';
            }
            
            console.log('🔔 Original type:', notification.type, 'Actual type:', actualType);
            
            // Navigate to appropriate section based on actual type
            if (actualType === 'bulk_request') {
                console.log('🔔 Switching to bulk-requests');
                this.switchSection('bulk-requests');
                setTimeout(() => {
                    const request = this.bulkRequests.find(r => r.id === notificationId);
                    if (request) {
                        this.viewBulkRequest(notificationId);
                    }
                }, 100);
            } else if (actualType === 'company_request') {
                console.log('🔔 Switching to company-requests');
                this.switchSection('company-requests');
                setTimeout(() => {
                    const request = this.companyRequests.find(r => r.id === notificationId);
                    if (request) {
                        this.viewCompanyRequest(notificationId);
                    }
                }, 100);
            } else {
                console.log('🔔 Switching to requests');
                // Regular request
                this.switchSection('requests');
                setTimeout(() => {
                    const request = this.requests.find(r => r.id === notificationId);
                    if (request) {
                        this.viewRequest(notificationId);
                    }
                }, 100);
            }
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(type) {
        const typeMap = {
            'request': 'new_request',
            'bulk': 'bulk_request',
            'company': 'company_request'
        };
        this.unreadNotifications.forEach(n => {
            if (n.type === typeMap[type]) n.read = true;
        });
        localStorage.setItem('unreadNotifications', JSON.stringify(this.unreadNotifications));
        this.updateNotificationBadge();
        this.renderNotificationDropdown(type);
    }

    /**
     * Clear all notifications
     */
    clearAllNotifications(type) {
        if (!confirm('هل أنت متأكد من مسح جميع الإشعارات؟')) {
            return;
        }
        const typeMap = {
            'request': 'new_request',
            'bulk': 'bulk_request',
            'company': 'company_request'
        };
        this.unreadNotifications = this.unreadNotifications.filter(n => n.type !== typeMap[type]);
        localStorage.setItem('unreadNotifications', JSON.stringify(this.unreadNotifications));
        this.updateNotificationBadge();
        this.renderNotificationDropdown(type);
        toast.success('تم مسح جميع الإشعارات');
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
     * Convert snake_case from Supabase to camelCase for frontend
     */
    convertToCamelCase(obj) {
        if (!obj) return obj;
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertToCamelCase(item));
        }
        if (typeof obj !== 'object') return obj;
        
        const converted = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
                converted[camelKey] = this.convertToCamelCase(obj[key]);
            }
        }
        return converted;
    }

    /**
     * Load data from API (shared across all users)
     */
    async loadData() {
        try {
            console.log('📡 Fetching data from API...');
            // Use same-origin API (Vercel handles both frontend and backend)
            const apiUrl = '/api';
            const [usersRes, requestsRes, ordersRes, productsRes, bulkRequestsRes, companyRequestsRes] = await Promise.all([
                fetch(`${apiUrl}/users`).then(r => r.json()).catch(() => []),
                fetch(`${apiUrl}/requests`).then(r => r.json()).catch(() => []),
                fetch(`${apiUrl}/orders`).then(r => r.json()).catch(() => []),
                fetch(`${apiUrl}/products`).then(r => r.json()).catch(() => []),
                fetch(`${apiUrl}/bulk-requests`).then(r => r.json()).catch(() => []),
                fetch(`${apiUrl}/company-requests`).then(r => r.json()).catch(() => [])
            ]);
            
            console.log('📊 Bulk requests API response:', bulkRequestsRes);
            console.log('📊 Company requests API response:', companyRequestsRes);
            
            // Convert from snake_case to camelCase
            this.users = this.convertToCamelCase(Array.isArray(usersRes) ? usersRes : []);
            this.requests = this.convertToCamelCase(Array.isArray(requestsRes) ? requestsRes : []);
            this.orders = this.convertToCamelCase(Array.isArray(ordersRes) ? ordersRes : []);
            this.products = this.convertToCamelCase(Array.isArray(productsRes) ? productsRes : []);
            this.bulkRequests = this.convertToCamelCase(Array.isArray(bulkRequestsRes) ? bulkRequestsRes : []);
            this.companyRequests = this.convertToCamelCase(Array.isArray(companyRequestsRes) ? companyRequestsRes : []);

            console.log('📊 Loaded bulk requests:', this.bulkRequests);
            console.log('📊 Bulk requests count:', this.bulkRequests.length);
            console.log('📊 Loaded company requests:', this.companyRequests);
            console.log('📊 Company requests count:', this.companyRequests.length);

            // Debug: Check first bulk request for devices
            if (this.bulkRequests.length > 0) {
                console.log('🔍 First bulk request data:', this.bulkRequests[0]);
                console.log('🔍 First bulk request devices:', this.bulkRequests[0].devices);
                console.log('🔍 First bulk request devices count:', this.bulkRequests[0].devices?.length || 0);
            }

            console.log(`✅ Data loaded: ${this.requests.length} requests, ${this.products.length} products, ${this.bulkRequests.length} bulk requests`);
        } catch (error) {
            console.error('Failed to load data from API:', error);
            // Fallback to localStorage
            this.users = storage.getUsers();
            this.requests = storage.getRequests();
            this.orders = storage.getOrders();
            this.products = storage.getProducts();
            this.bulkRequests = [];
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
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.openStatFilter('requests','completed')" title="عرض الطلبات المكتملة">
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
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.switchSection('company-requests')" title="عرض موظفي الشركة">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.2);">
                        <i class="fas fa-building" style="color: #10b981;"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.companyTotalRequests}</h3>
                        <p>موظفي الشركة</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.switchSection('company-requests')" title="عرض إيرادات الشركات">
                    <div class="stat-icon success" style="background: rgba(16, 185, 129, 0.2);">
                        <i class="fas fa-dollar-sign" style="color: #10b981;"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${Utils.formatCurrency(stats.companyRevenue)}</h3>
                        <p>إيرادات الشركات</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.switchSection('bulk-requests')" title="عرض طلبات الجملة">
                    <div class="stat-icon" style="background: rgba(245, 158, 11, 0.2);">
                        <i class="fas fa-boxes" style="color: #f59e0b;"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${stats.bulkTotalRequests}</h3>
                        <p>طلبات الجملة</p>
                    </div>
                    <i class="fas fa-arrow-left stat-arrow"></i>
                </div>
                <div class="glass-card stat-card stat-card-clickable" onclick="adminManager.switchSection('bulk-requests')" title="عرض إيرادات الجملة">
                    <div class="stat-icon success" style="background: rgba(245, 158, 11, 0.2);">
                        <i class="fas fa-dollar-sign" style="color: #f59e0b;"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${Utils.formatCurrency(stats.bulkRevenue)}</h3>
                        <p>إيرادات الجملة</p>
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
     * Calculate dashboard statistics
     */
    calculateStatistics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('📊 Today:', today);
        console.log('📊 Total normal requests:', this.requests.length);
        console.log('📊 Total bulk requests:', this.bulkRequests.length);
        console.log('📊 Total company requests:', this.companyRequests.length);

        // Today's orders from all request types
        const todayNormalOrders = this.requests.filter(r => {
            const requestDate = new Date(r.createdAt);
            const isToday = requestDate >= today;
            console.log('📊 Normal request:', r.requestNumber, 'Date:', r.createdAt, 'Is today:', isToday);
            return isToday;
        });
        const todayBulkOrders = this.bulkRequests.filter(r => {
            const requestDate = new Date(r.createdAt);
            const isToday = requestDate >= today;
            console.log('📊 Bulk request:', r.requestNumber, 'Date:', r.createdAt, 'Is today:', isToday);
            return isToday;
        });
        const todayCompanyOrders = this.companyRequests.filter(r => {
            const requestDate = new Date(r.createdAt);
            const isToday = requestDate >= today;
            console.log('📊 Company request:', r.requestNumber, 'Date:', r.createdAt, 'Is today:', isToday);
            return isToday;
        });
        const todayOrders = todayNormalOrders.length + todayBulkOrders.length + todayCompanyOrders.length;

        console.log('📊 Today normal orders:', todayNormalOrders.length);
        console.log('📊 Today bulk orders:', todayBulkOrders.length);
        console.log('📊 Today company orders:', todayCompanyOrders.length);
        console.log('📊 Total today orders:', todayOrders);

        const totalRevenue = this.requests
            .filter(r => r.cost && r.cost > 0)
            .reduce((sum, r) => sum + (r.cost || 0), 0);

        // Company requests stats (separate)
        const companyRevenue = this.companyRequests
            .filter(r => r.cost && r.cost > 0)
            .reduce((sum, r) => sum + (r.cost || 0), 0);

        const companyOpenRequests = this.companyRequests.filter(r =>
            ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
        );
        const companyCompletedRequests = this.companyRequests.filter(r => r.status === 'Delivered');

        // Bulk requests stats (separate)
        const bulkRevenue = this.bulkRequests
            .filter(r => r.cost && r.cost > 0)
            .reduce((sum, r) => sum + (r.cost || 0), 0);

        const bulkOpenRequests = this.bulkRequests.filter(r =>
            ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
        );
        const bulkCompletedRequests = this.bulkRequests.filter(r => r.status === 'Delivered');

        // Normal requests stats (separate)
        const openRequests = this.requests.filter(r =>
            ['Received', 'Waiting Inspection', 'Under Maintenance', 'Waiting Parts'].includes(r.status)
        );
        const completedRequests = this.requests.filter(r => r.status === 'Delivered');

        return {
            // Normal requests stats
            totalRequests: this.requests.length,
            completedRequests: completedRequests.length,
            todayOrders: todayOrders,
            totalRevenue: totalRevenue,
            
            // Company requests stats (separate)
            companyTotalRequests: this.companyRequests.length,
            companyOpenRequests: companyOpenRequests.length,
            companyCompletedRequests: companyCompletedRequests.length,
            companyRevenue: companyRevenue,
            
            // Bulk requests stats (separate)
            bulkTotalRequests: this.bulkRequests.length,
            bulkOpenRequests: bulkOpenRequests.length,
            bulkCompletedRequests: bulkCompletedRequests.length,
            bulkRevenue: bulkRevenue,
            
            // Other stats
            totalProducts: this.products.length,
            totalOrders: this.orders.length,
            bulkRequestsCount: this.bulkRequests.length
        };
    }

    /**
     * Render charts
     */
    renderCharts() {
        this.destroyCharts();
        this.renderRequestsChart();
        this.renderRevenueChart();
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
                    <h3>لا يوجد مستخدمين</h3>
                    <p>لا يوجد مستخدمين في النظام حالياً.</p>
                    <button class="btn btn-primary" onclick="adminManager.showAddUserModal()">
                        <i class="fas fa-plus"></i> إضافة مستخدم جديد
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                <button class="btn btn-primary" onclick="adminManager.showAddUserModal()">
                    <i class="fas fa-plus"></i> إضافة مستخدم جديد
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
                            <span class="user-role user-role-${user.role}">
                                ${user.role === 'admin' ? 'مدير' : user.role === 'super_admin' ? 'مدير عام' : 'مستخدم'}
                            </span>
                        </div>
                        <div class="user-actions">
                            <button class="btn btn-primary" onclick="adminManager.editUser(${user.id})">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            ${user.id !== this.currentUser.id && user.role !== 'super_admin' ? `
                                <button class="btn btn-danger" onclick="adminManager.deleteUser(${user.id})">
                                    <i class="fas fa-trash"></i> حذف
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
                    <label class="form-label">الاسم</label>
                    <input type="text" class="form-input" name="name" required placeholder="أدخل الاسم">
                </div>
                <div class="form-group">
                    <label class="form-label">اسم المستخدم</label>
                    <input type="text" class="form-input" name="username" required placeholder="أدخل اسم المستخدم">
                </div>
                <div class="form-group">
                    <label class="form-label">كلمة المرور</label>
                    <input type="password" class="form-input" name="password" required placeholder="أدخل كلمة المرور">
                </div>
                <div class="form-group">
                    <label class="form-label">البريد الإلكتروني</label>
                    <input type="email" class="form-input" name="email" placeholder="أدخل البريد الإلكتروني">
                </div>
                <div class="form-group">
                    <label class="form-label">الصلاحية</label>
                    <select class="form-select" name="role">
                        <option value="employee">موظف</option>
                        <option value="technician">فني</option>
                        <option value="admin">مدير</option>
                        ${this.currentUser.role === 'super_admin' ? '<option value="super_admin">مدير عام</option>' : ''}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-plus"></i> إضافة المستخدم
                </button>
            </form>
        `;

        modalManager.create('add-user', 'إضافة مستخدم جديد', content);
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
            toast.success('تم إضافة المستخدم بنجاح');
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
                    <label class="form-label">الاسم</label>
                    <input type="text" class="form-input" name="name" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">اسم المستخدم</label>
                    <input type="text" class="form-input" name="username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">كلمة المرور (اتركها فارغة للحفاظ على الحالية)</label>
                    <input type="password" class="form-input" name="password">
                </div>
                <div class="form-group">
                    <label class="form-label">البريد الإلكتروني</label>
                    <input type="email" class="form-input" name="email" value="${user.email || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">الصلاحية</label>
                    <select class="form-select" name="role">
                        <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>موظف</option>
                        <option value="technician" ${user.role === 'technician' ? 'selected' : ''}>فني</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>مدير</option>
                        ${this.currentUser.role === 'super_admin' ? `<option value="super_admin" ${user.role === 'super_admin' ? 'selected' : ''}>مدير عام</option>` : ''}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> حفظ التغييرات
                </button>
            </form>
        `;

        modalManager.create('edit-user', 'تعديل المستخدم', content);
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
            toast.success('تم تحديث المستخدم بنجاح');
        });
    }

    /**
     * Delete user
     */
    deleteUser(userId) {
        if (userId === this.currentUser.id) {
            toast.error('لا يمكنك حذف حسابك الخاص');
            return;
        }

        const content = `
            <div>
                <p style="margin-bottom: 1rem;">هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="modalManager.close('delete-user')">إلغاء</button>
                    <button class="btn btn-danger" onclick="adminManager.confirmDeleteUser(${userId})">حذف</button>
                </div>
            </div>
        `;

        modalManager.create('delete-user', 'حذف المستخدم', content);
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
        toast.success('تم حذف المستخدم بنجاح');
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
                    <h3>لا توجد منتجات</h3>
                    <p>لا توجد منتجات في النظام حالياً.</p>
                    <button class="btn btn-primary" onclick="adminManager.showAddProductModal()">
                        <i class="fas fa-plus"></i> إضافة منتج جديد
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                <button class="btn btn-primary" onclick="adminManager.showAddProductModal()">
                    <i class="fas fa-plus"></i> إضافة منتج جديد
                </button>
            </div>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>المنتج</th>
                            <th>التصنيف</th>
                            <th>السعر</th>
                            <th>المخزون</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
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
                                    <span class="status-badge ${product.stock > 0 ? 'status-active' : 'status-inactive'}">
                                        ${product.stock > 0 ? 'متوفر' : 'نفدت الكمية'}
                                    </span>
                                </td>
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
                    <label class="form-label">اسم المنتج</label>
                    <input type="text" class="form-input" name="name" required placeholder="أدخل اسم المنتج">
                </div>
                <div class="form-group">
                    <label class="form-label">التصنيف</label>
                    <select class="form-select" name="category">
                        <option value="لابتوب">لابتوب</option>
                        <option value="شاشة">شاشة</option>
                        <option value="رامات">رامات</option>
                        <option value="هارد">هارد/SSD</option>
                        <option value="بطارية">بطارية</option>
                        <option value="شاحن">شاحن</option>
                        <option value="اكسسوارات">اكسسوارات</option>
                        <option value="أخرى">أخرى</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">السعر (ج.م)</label>
                    <input type="number" class="form-input" name="price" step="0.01" min="0" required placeholder="أدخل السعر">
                </div>
                <div class="form-group">
                    <label class="form-label">المخزون</label>
                    <input type="number" class="form-input" name="stock" min="0" required placeholder="الكمية المتاحة">
                </div>
                <div class="form-group">
                    <label class="form-label">صورة المنتج</label>
                    <input type="file" class="form-input" name="imageFile" accept="image/*">
                    <input type="hidden" name="image" id="productImageInput">
                </div>
                <div class="form-group">
                    <label class="form-label">الوصف</label>
                    <textarea class="form-textarea" name="description" rows="3" required placeholder="وصف المنتج"></textarea>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" name="featured" style="width: 18px; height: 18px;">
                        <span>عرض في الصفحة الرئيسية</span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-plus"></i> إضافة المنتج
                </button>
            </form>
        `;

        modalManager.create('add-product', 'إضافة منتج جديد', content);
        modalManager.open('add-product');

        const form = document.getElementById('addProductForm');
        const imageFile = form.querySelector('input[name="imageFile"]');
        const imageInput = document.getElementById('productImageInput');

        imageFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageInput.value = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const productData = {
                name: form.name.value,
                category: form.category.value,
                price: parseFloat(form.price.value),
                stock: parseInt(form.stock.value),
                image: form.image.value || 'https://via.placeholder.com/300x200/1e3a8a/ffffff?text=No+Image',
                description: form.description.value,
                featured: form.featured.checked,
                createdAt: new Date().toISOString()
            };

            storage.createProduct(productData);
            this.loadData();
            this.renderProductsManagement();
            this.renderCharts();
            modalManager.close('add-product');
            toast.success('تم إضافة المنتج بنجاح');
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
                    <label class="form-label">اسم المنتج</label>
                    <input type="text" class="form-input" name="name" value="${product.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">التصنيف</label>
                    <select class="form-select" name="category">
                        <option value="لابتوب" ${product.category === 'لابتوب' ? 'selected' : ''}>لابتوب</option>
                        <option value="شاشة" ${product.category === 'شاشة' ? 'selected' : ''}>شاشة</option>
                        <option value="رامات" ${product.category === 'رامات' ? 'selected' : ''}>رامات</option>
                        <option value="هارد" ${product.category === 'هارد' ? 'selected' : ''}>هارد/SSD</option>
                        <option value="بطارية" ${product.category === 'بطارية' ? 'selected' : ''}>بطارية</option>
                        <option value="شاحن" ${product.category === 'شاحن' ? 'selected' : ''}>شاحن</option>
                        <option value="اكسسوارات" ${product.category === 'اكسسوارات' ? 'selected' : ''}>اكسسوارات</option>
                        <option value="أخرى" ${product.category === 'أخرى' ? 'selected' : ''}>أخرى</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">السعر (ج.م)</label>
                    <input type="number" class="form-input" name="price" value="${product.price}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">المخزون</label>
                    <input type="number" class="form-input" name="stock" value="${product.stock}" min="0" required>
                </div>
                <div class="form-group">
                    <label class="form-label">صورة المنتج</label>
                    <input type="file" class="form-input" name="imageFile" accept="image/*">
                    <input type="hidden" name="image" id="editProductImageInput" value="${product.image}">
                </div>
                <div class="form-group">
                    <label class="form-label">الوصف</label>
                    <textarea class="form-textarea" name="description" rows="3" required>${product.description}</textarea>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" name="featured" style="width: 18px; height: 18px;" ${product.featured ? 'checked' : ''}>
                        <span>عرض في الصفحة الرئيسية</span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> حفظ التغييرات
                </button>
            </form>
        `;

        modalManager.create('edit-product', 'تعديل المنتج', content);
        modalManager.open('edit-product');

        const form = document.getElementById('editProductForm');
        const imageFile = form.querySelector('input[name="imageFile"]');
        const imageInput = document.getElementById('editProductImageInput');

        imageFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imageInput.value = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

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
            toast.success('تم تحديث المنتج بنجاح');
        });
    }

    /**
     * Delete product
     */
    deleteProduct(productId) {
        const content = `
            <div>
                <p style="margin-bottom: 1rem;">هل أنت متأكد من حذف هذا المنتج؟ هذا الإجراء لا يمكن التراجع عنه.</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="modalManager.close('delete-product')">إلغاء</button>
                    <button class="btn btn-danger" onclick="adminManager.confirmDeleteProduct(${productId})">حذف</button>
                </div>
            </div>
        `;

        modalManager.create('delete-product', 'حذف المنتج', content);
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
        toast.success('تم حذف المنتج بنجاح');
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
            case 'bulk-requests':
                this.renderBulkRequests();
                break;
            case 'company-requests':
                this.renderCompanyRequests();
                break;
            case 'users':
                this.renderUsers();
                break;
            case 'products':
                this.renderProductsManagement();
                break;
            case 'trash':
                this.renderTrash();
                break;
        }
    }

    /**
     * Render bulk requests table
     */
    renderBulkRequests() {
        const container = document.getElementById('bulkRequestsContainer');
        if (!container) return;

        // Use bulk requests from separate table
        const bulkRequests = this.bulkRequests || [];
        const filteredRequests = this.filterBulkRequests(bulkRequests);
        const { data, pages } = this.paginate(filteredRequests);

        if (data.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-boxes" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <p style="color: #94a3b8;">لا توجد طلبات جملة حالياً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>العميل</th>
                            <th>الهاتف</th>
                            <th>عدد اللابتوبات</th>
                            <th>الحالة</th>
                            <th>الأولوية</th>
                            <th>التاريخ</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(bulkRequest => `
                            <tr style="transition: background-color 0.2s;">
                                <td style="font-weight: 600; color: #3b82f6;">${bulkRequest.requestNumber}</td>
                                <td style="font-weight: 600;">${bulkRequest.customerName}</td>
                                <td dir="ltr">${bulkRequest.customerPhone}</td>
                                <td style="font-weight: 600; color: #3b82f6;">${bulkRequest.deviceCount}</td>
                                <td>
                                    <select class="form-select" style="padding: 0.25rem; font-size: 0.8rem; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0, 0, 0, 0.1);" onchange="adminManager.updateBulkRequestStatus(${bulkRequest.id}, this.value)">
                                        <option value="Received" ${bulkRequest.status === 'Received' ? 'selected' : ''} style="background-color: rgba(59, 130, 246, 0.9); color: white;">تم الاستلام</option>
                                        <option value="Waiting Inspection" ${bulkRequest.status === 'Waiting Inspection' ? 'selected' : ''} style="background-color: rgba(245, 158, 11, 0.9); color: white;">بانتظار الفحص</option>
                                        <option value="Under Maintenance" ${bulkRequest.status === 'Under Maintenance' ? 'selected' : ''} style="background-color: rgba(139, 92, 246, 0.9); color: white;">قيد الصيانة</option>
                                        <option value="Waiting Parts" ${bulkRequest.status === 'Waiting Parts' ? 'selected' : ''} style="background-color: rgba(239, 68, 68, 0.9); color: white;">بانتظار قطع الغيار</option>
                                        <option value="Ready" ${bulkRequest.status === 'Ready' ? 'selected' : ''} style="background-color: rgba(16, 185, 129, 0.9); color: white;">جاهز للتسليم</option>
                                        <option value="Delivered" ${bulkRequest.status === 'Delivered' ? 'selected' : ''} style="background-color: rgba(107, 114, 128, 0.9); color: white;">تم التسليم للعميل</option>
                                    </select>
                                </td>
                                <td><span class="priority-badge ${this.getPriorityClass(bulkRequest.priority)}">${this.translatePriority(bulkRequest.priority)}</span></td>
                                <td>${Utils.formatDate(bulkRequest.createdAt)}</td>
                                <td>
                                    <button class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;"
                                            onclick="adminManager.viewBulkRequestDevices(${bulkRequest.id})">
                                        <i class="fas fa-eye"></i> عرض الأجهزة
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.quickEditBulkRequest(${bulkRequest.id})" title="تعديل سريع">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.convertBulkRequestToSingle(${bulkRequest.id})" title="تحويل لطلب عادي">
                                        <i class="fas fa-laptop"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.convertBulkRequestToCompany(${bulkRequest.id})" title="تحويل لطلب موظفي شركة">
                                        <i class="fas fa-building"></i>
                                    </button>
                                    <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.deleteBulkRequest(${bulkRequest.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="bulkRequestsPagination"></div>
        `;

        this.renderPagination('bulkRequestsPagination', pages);
    }

    /**
     * Render company requests table
     */
    renderCompanyRequests() {
        const container = document.getElementById('companyRequestsContainer');
        if (!container) return;

        const companyRequests = this.companyRequests || [];
        const filteredRequests = this.filterCompanyRequests(companyRequests);
        const { data, pages } = this.paginate(filteredRequests);

        if (data.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-building" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <p style="color: #94a3b8;">لا توجد طلبات موظفي الشركة حالياً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table class="table">
                    <thead>
                        <tr>
                            <th>رقم الطلب</th>
                            <th>الاسم</th>
                            <th>الهاتف</th>
                            <th>الجهاز</th>
                            <th>الحالة</th>
                            <th>الأولوية</th>
                            <th>رد الإدارة</th>
                            <th>الفني</th>
                            <th>التاريخ</th>
                            <th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(companyRequest => `
                            <tr style="transition: background-color 0.2s;">
                                <td style="font-weight: 600; color: #3b82f6;">${companyRequest.request_number || companyRequest.requestNumber}</td>
                                <td style="font-weight: 600;">${companyRequest.full_name || companyRequest.fullName}</td>
                                <td dir="ltr">${companyRequest.phone}</td>
                                <td>${companyRequest.laptop_brand || companyRequest.laptopBrand} ${companyRequest.laptop_model || companyRequest.laptopModel || ''}</td>
                                <td>
                                    <select class="form-select" style="padding: 0.25rem; font-size: 0.8rem; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0, 0, 0, 0.1);" onchange="adminManager.updateCompanyRequestStatus(${companyRequest.id}, this.value)">
                                        <option value="Received" ${companyRequest.status === 'Received' ? 'selected' : ''} style="background-color: rgba(59, 130, 246, 0.9); color: white;">تم الاستلام</option>
                                        <option value="Waiting Inspection" ${companyRequest.status === 'Waiting Inspection' ? 'selected' : ''} style="background-color: rgba(245, 158, 11, 0.9); color: white;">بانتظار الفحص</option>
                                        <option value="Under Maintenance" ${companyRequest.status === 'Under Maintenance' ? 'selected' : ''} style="background-color: rgba(139, 92, 246, 0.9); color: white;">قيد الصيانة</option>
                                        <option value="Waiting Parts" ${companyRequest.status === 'Waiting Parts' ? 'selected' : ''} style="background-color: rgba(239, 68, 68, 0.9); color: white;">بانتظار قطع الغيار</option>
                                        <option value="Ready" ${companyRequest.status === 'Ready' ? 'selected' : ''} style="background-color: rgba(16, 185, 129, 0.9); color: white;">جاهز للتسليم</option>
                                        <option value="Delivered" ${companyRequest.status === 'Delivered' ? 'selected' : ''} style="background-color: rgba(107, 114, 128, 0.9); color: white;">تم التسليم للعميل</option>
                                    </select>
                                </td>
                                <td><span class="priority-badge ${this.getPriorityClass(companyRequest.priority)}">${this.translatePriority(companyRequest.priority)}</span></td>
                                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${companyRequest.admin_reply || companyRequest.adminReply || '—'}</td>
                                <td>${companyRequest.technician || '—'}</td>
                                <td>${Utils.formatDate(companyRequest.created_at || companyRequest.createdAt)}</td>
                                <td>
                                    <button class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;"
                                            onclick="adminManager.viewCompanyRequest(${companyRequest.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.quickEditCompanyRequest(${companyRequest.id})" title="تعديل سريع">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.convertCompanyRequestToSingle(${companyRequest.id})" title="تحويل لطلب عادي">
                                        <i class="fas fa-laptop"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.convertCompanyRequestToBulk(${companyRequest.id})" title="تحويل لطلب جملة">
                                        <i class="fas fa-boxes"></i>
                                    </button>
                                    <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.deleteCompanyRequest(${companyRequest.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="companyRequestsPagination"></div>
        `;

        this.renderPagination('companyRequestsPagination', pages);
    }

    /**
     * Filter company requests
     */
    filterCompanyRequests(requests) {
        const searchTerm = document.getElementById('companySearchInput')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('companyStatusFilter')?.value || '';

        let filtered = [...requests];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(r => 
                ((r.full_name || r.fullName) && (r.full_name || r.fullName).toLowerCase().includes(searchTerm)) ||
                (r.phone && r.phone.includes(searchTerm)) ||
                ((r.request_number || r.requestNumber) && (r.request_number || r.requestNumber).toLowerCase().includes(searchTerm))
            );
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        return filtered;
    }

    /**
     * View company request details
     */
    async viewCompanyRequest(companyRequestId) {
        try {
            const response = await fetch(`/api/company-requests/${companyRequestId}`);
            if (!response.ok) throw new Error('Failed to fetch company request details');
            
            const companyRequest = await response.json();
            
            const content = `
                <div style="max-height: 70vh; overflow-y: auto;">
                    <div class="request-card-header">
                        <div>
                            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${companyRequest.request_number || companyRequest.requestNumber}</h3>
                            <span class="status-badge ${this.getStatusClass(companyRequest.status)}">${this.translateStatus(companyRequest.status)}</span>
                        </div>
                    </div>
                    <div class="request-details">
                        <div class="request-detail-item"><span class="request-detail-label">الاسم</span><span class="request-detail-value">${companyRequest.full_name || companyRequest.fullName || ''}</span></div>
                        <div class="request-detail-item">
                            <span class="request-detail-label">رقم الهاتف</span>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span class="request-detail-value" id="companyRequestPhone_${companyRequest.id}">${companyRequest.phone || ''}</span>
                                <button type="button" onclick="adminManager.enableCompanyRequestPhoneEdit(${companyRequest.id})" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; white-space: nowrap; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5);">
                                    <i class="fas fa-edit"></i> تعديل
                                </button>
                            </div>
                        </div>
                        <div class="request-detail-item"><span class="request-detail-label">الجهاز</span><span class="request-detail-value">${companyRequest.laptop_brand || companyRequest.laptopBrand || ''} ${companyRequest.laptop_model || companyRequest.laptopModel || ''}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">الرقم التسلسلي</span><span class="request-detail-value" dir="ltr">${companyRequest.serial_number || companyRequest.serialNumber || '—'}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">تاريخ الاستلام</span><span class="request-detail-value">${companyRequest.received_date || companyRequest.receivedDate ? Utils.formatDate(companyRequest.received_date || companyRequest.receivedDate) : '—'}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">تاريخ الطلب</span><span class="request-detail-value">${Utils.formatDate(companyRequest.created_at || companyRequest.createdAt)}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">المشكلة</span><span class="request-detail-value">${companyRequest.problem_description || companyRequest.problemDescription || ''}</span></div>
                    </div>

                    <form id="editCompanyRequestForm" style="margin-top: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">رقم الهاتف</label>
                            <input type="tel" class="form-input" name="phone" value="${companyRequest.phone || ''}" placeholder="أدخل رقم الهاتف">
                        </div>
                        <div class="form-group">
                            <label class="form-label">وصف المشكلة</label>
                            <textarea class="form-textarea" name="problemDescription" rows="3">${companyRequest.problem_description || companyRequest.problemDescription || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">رد الإدارة</label>
                            <textarea class="form-textarea" name="adminReply" rows="3">${companyRequest.admin_reply || companyRequest.adminReply || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">تكلفة الصيانة (ج.م)</label>
                            <input type="number" class="form-input" name="cost" value="${companyRequest.cost || ''}" placeholder="أدخل تكلفة الصيانة" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">الفني المسؤول (يمكن اختيار أكثر من فني)</label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; max-height: 200px; overflow-y: auto; border: 1px solid #374151; border-radius: 0.375rem; padding: 0.5rem;">
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ ابراهيم" ${companyRequest.technician && companyRequest.technician.includes('استاذ ابراهيم') ? 'checked' : ''}> استاذ ابراهيم
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ محمد شاهين" ${companyRequest.technician && companyRequest.technician.includes('استاذ محمد شاهين') ? 'checked' : ''}> استاذ محمد شاهين
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="علياء" ${companyRequest.technician && companyRequest.technician.includes('علياء') ? 'checked' : ''}> علياء
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="سلمي" ${companyRequest.technician && companyRequest.technician.includes('سلمي') ? 'checked' : ''}> سلمي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة سهير رمزي" ${companyRequest.technician && companyRequest.technician.includes('استاذة سهير رمزي') ? 'checked' : ''}> استاذة سهير رمزي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة ناديه" ${companyRequest.technician && companyRequest.technician.includes('استاذة ناديه') ? 'checked' : ''}> استاذة ناديه
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة ام كلثوم" ${companyRequest.technician && companyRequest.technician.includes('استاذة ام كلثوم') ? 'checked' : ''}> استاذة ام كلثوم
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة اسماء" ${companyRequest.technician && companyRequest.technician.includes('استاذة اسماء') ? 'checked' : ''}> استاذة اسماء
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ خالد و عبدالله رضا" ${companyRequest.technician && companyRequest.technician.includes('استاذ خالد و عبدالله رضا') ? 'checked' : ''}> استاذ خالد و عبدالله رضا
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ محمد علي و عم وليد" ${companyRequest.technician && companyRequest.technician.includes('استاذ محمد علي و عم وليد') ? 'checked' : ''}> استاذ محمد علي و عم وليد
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="الاستاذ عبد الدالي" ${companyRequest.technician && companyRequest.technician.includes('الاستاذ عبد الدالي') ? 'checked' : ''}> الاستاذ عبد الدالي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="الاستاذ نادر" ${companyRequest.technician && companyRequest.technician.includes('الاستاذ نادر') ? 'checked' : ''}> الاستاذ نادر
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="الاستاذ عبدالله موسي" ${companyRequest.technician && companyRequest.technician.includes('الاستاذ عبدالله موسي') ? 'checked' : ''}> الاستاذ عبدالله موسي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ احمد اسلام و احمد طه" ${companyRequest.technician && companyRequest.technician.includes('استاذ احمد اسلام و احمد طه') ? 'checked' : ''}> استاذ احمد اسلام و احمد طه
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="المهندس عبد الفتاح وادم" ${companyRequest.technician && companyRequest.technician.includes('المهندس عبد الفتاح وادم') ? 'checked' : ''}> المهندس عبد الفتاح وادم
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">تاريخ ووقت الاستلام المتوقع</label>
                            <input type="datetime-local" class="form-input" name="estimatedCompletionDate" value="${companyRequest.estimated_completion_date || companyRequest.estimatedCompletionDate ? new Date(companyRequest.estimated_completion_date || companyRequest.estimatedCompletionDate).toISOString().slice(0, 16) : ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">تحديث الحالة</label>
                            <select class="form-select" name="status">
                                <option value="Received" ${companyRequest.status === 'Received' ? 'selected' : ''}>تم الاستلام</option>
                                <option value="Waiting Inspection" ${companyRequest.status === 'Waiting Inspection' ? 'selected' : ''}>بانتظار الفحص</option>
                                <option value="Under Maintenance" ${companyRequest.status === 'Under Maintenance' ? 'selected' : ''}>قيد الصيانة</option>
                                <option value="Waiting Parts" ${companyRequest.status === 'Waiting Parts' ? 'selected' : ''}>بانتظار قطع الغيار</option>
                                <option value="Ready" ${companyRequest.status === 'Ready' ? 'selected' : ''}>جاهز للتسليم</option>
                                <option value="Delivered" ${companyRequest.status === 'Delivered' ? 'selected' : ''}>تم التسليم للعميل</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ التغييرات</button>
                    </form>
                </div>
            `;
            
            modalManager.create('view-company-request', 'تفاصيل الطلب', content);
            modalManager.open('view-company-request');

            const form = document.getElementById('editCompanyRequestForm');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const estimatedCompletionDateValue = form.estimatedCompletionDate.value;
                let estimatedCompletionDate = null;
                if (estimatedCompletionDateValue) {
                    const dateObj = new Date(estimatedCompletionDateValue);
                    if (!isNaN(dateObj.getTime())) {
                        estimatedCompletionDate = dateObj.toISOString();
                    }
                }

                const updateData = {
                    phone: form.phone.value,
                    problem_description: form.problemDescription.value,
                    admin_reply: form.adminReply.value,
                    cost: parseFloat(form.cost.value) || 0,
                    technician: Array.from(form.querySelectorAll('input[name="technician"]:checked')).map(cb => cb.value).join(' و '),
                    estimated_completion_date: estimatedCompletionDate,
                    status: form.status.value
                };

                try {
                    const response = await fetch(`/api/company-requests/${companyRequestId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updateData)
                    });

                    if (!response.ok) throw new Error('Failed to update company request');

                    const updatedData = await response.json();
                    
                    // Update local data instead of reloading everything
                    const index = this.companyRequests.findIndex(r => r.id === companyRequestId);
                    if (index !== -1) {
                        this.companyRequests[index] = { ...this.companyRequests[index], ...updatedData };
                        this.renderCompanyRequests();
                    }

                    toast.success('تم تحديث الطلب بنجاح');
                    modalManager.close('view-company-request');
                } catch (error) {
                    console.error('Error updating company request:', error);
                    toast.error('فشل تحديث الطلب');
                }
            });
        } catch (error) {
            console.error('Error viewing company request:', error);
            toast.error('فشل تحميل تفاصيل الطلب');
        }
    }

    /**
     * Delete company request
     */
    async deleteCompanyRequest(companyRequestId) {
        if (!confirm('هل أنت متأكد من حذف طلب موظفي الشركة؟ سيتم نقله إلى سلة المحذوفات ويمكن استعادته.')) {
            return;
        }

        try {
            const response = await fetch(`/api/company-requests/${companyRequestId}/soft-delete`, {
                method: 'PUT'
            });

            if (response.ok) {
                toast.success('تم نقل طلب موظفي الشركة إلى سلة المحذوفات');
                await this.loadData();
                this.renderCompanyRequests();
            } else {
                throw new Error('Failed to soft delete company request');
            }
        } catch (error) {
            console.error('Error soft deleting company request:', error);
            toast.error('فشل في حذف طلب موظفي الشركة');
        }
    }

    /**
     * Convert company request to bulk request
     */
    async convertCompanyRequestToBulk(companyRequestId) {
        if (!confirm('هل أنت متأكد من تحويل هذا الطلب إلى طلب جملة؟ سيتم نقله من قسم طلبات موظفي الشركة إلى قسم طلبات الجملة.')) {
            return;
        }

        try {
            loading.show('جاري تحويل الطلب...');
            const response = await fetch(`/api/company-requests/${companyRequestId}/convert-to-bulk`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('تم تحويل الطلب إلى طلب جملة بنجاح');
                await this.loadData();
                this.renderCompanyRequests();
            } else {
                throw new Error('Failed to convert request');
            }
        } catch (error) {
            console.error('Error converting company request to bulk:', error);
            toast.error('فشل في تحويل الطلب');
        } finally {
            loading.hide();
        }
    }

    /**
     * Convert company request to single request
     */
    async convertCompanyRequestToSingle(companyRequestId) {
        if (!confirm('هل أنت متأكد من تحويل هذا الطلب إلى طلب عادي؟')) {
            return;
        }

        try {
            loading.show('جاري تحويل الطلب...');
            const response = await fetch(`/api/company-requests/${companyRequestId}/convert-to-single`, {
                method: 'POST'
            });

            if (response.ok) {
                toast.success('تم تحويل الطلب بنجاح');
                await this.loadData();
                this.renderCompanyRequests();
            } else {
                throw new Error('Failed');
            }
        } catch (error) {
            toast.error('فشل في تحويل الطلب');
        } finally {
            loading.hide();
        }
    }

    /**
     * Convert bulk request to single request
     */
    async convertBulkRequestToSingle(bulkRequestId) {
        if (!confirm('هل أنت متأكد من تحويل هذا الطلب إلى طلب عادي؟')) {
            return;
        }

        try {
            loading.show('جاري تحويل الطلب...');
            const response = await fetch(`/api/bulk-requests/${bulkRequestId}/convert-to-single`, {
                method: 'POST'
            });

            if (response.ok) {
                toast.success('تم تحويل الطلب بنجاح');
                await this.loadData();
                this.renderBulkRequests();
            } else {
                throw new Error('Failed');
            }
        } catch (error) {
            toast.error('فشل في تحويل الطلب');
        } finally {
            loading.hide();
        }
    }

    /**
     * Convert bulk request to company request
     */
    async convertBulkRequestToCompany(bulkRequestId) {
        if (!confirm('هل أنت متأكد من تحويل هذا الطلب إلى طلب موظفي شركة؟ سيتم نقله من قسم طلبات الجملة إلى قسم طلبات موظفي الشركة. سيتم تحويل أول جهاز فقط.')) {
            return;
        }

        try {
            loading.show('جاري تحويل الطلب...');
            const response = await fetch(`/api/bulk-requests/${bulkRequestId}/convert-to-company`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('تم تحويل الطلب إلى طلب موظفي شركة بنجاح');
                await this.loadData();
                this.renderBulkRequests();
            } else {
                throw new Error('Failed to convert request');
            }
        } catch (error) {
            console.error('Error converting bulk request to company:', error);
            toast.error('فشل في تحويل الطلب');
        } finally {
            loading.hide();
        }
    }

    /**
     * Delete all company requests
     */
    async deleteAllCompanyRequests() {
        if (!confirm('هل أنت متأكد من حذف جميع طلبات موظفي الشركة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            return;
        }

        try {
            const response = await fetch('/api/company-requests', {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('تم حذف جميع طلبات موظفي الشركة بنجاح');
                await this.loadData();
                this.renderCompanyRequests();
            } else {
                toast.error('فشل حذف الطلبات');
            }
        } catch (error) {
            console.error('Error deleting all company requests:', error);
            toast.error('فشل حذف جميع الطلبات');
        }
    }

    /**
     * Delete all bulk requests
     */
    async deleteAllBulkRequests() {
        if (!confirm('هل أنت متأكد من حذف جميع طلبات الجملة؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            return;
        }

        try {
            const response = await fetch('/api/bulk-requests', {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('تم حذف جميع طلبات الجملة بنجاح');
                await this.loadData();
                this.renderBulkRequests();
            } else {
                const errorText = await response.text();
                console.error('Delete all failed:', errorText);
                toast.error('فشل حذف جميع الطلبات');
            }
        } catch (error) {
            console.error('Error deleting all bulk requests:', error);
            toast.error('فشل حذف جميع الطلبات');
        }
    }
    groupBulkRequestsByCustomer(requests) {
        const groups = {};
        
        requests.forEach(request => {
            const key = request.phone;
            if (!groups[key]) {
                groups[key] = {
                    customerName: request.fullName,
                    customerPhone: request.phone,
                    deviceCount: 0,
                    requestNumbers: [],
                    status: request.status,
                    createdAt: request.createdAt
                };
            }
            groups[key].deviceCount++;
            groups[key].requestNumbers.push(request.requestNumber);
        });

        return Object.values(groups);
    }

    /**
     * Filter bulk requests
     */
    filterBulkRequests(requests) {
        const searchTerm = document.getElementById('bulkSearchInput')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('bulkStatusFilter')?.value || 'All';

        let filtered = [...requests];

        // Search filter - by brand and serial number
        if (searchTerm) {
            filtered = filtered.filter(r => 
                r.devices && r.devices.some(d => 
                    (d.laptopBrand && d.laptopBrand.toLowerCase().includes(searchTerm)) ||
                    (d.serialNumber && d.serialNumber.toLowerCase().includes(searchTerm))
                )
            );
        }

        // Status filter
        if (statusFilter !== 'All') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        return filtered;
    }

    /**
     * View all devices in a bulk request
     */
    async viewBulkRequestDevices(bulkRequestId) {
        try {
            const response = await fetch(`/api/bulk-requests/${bulkRequestId}`);
            if (!response.ok) throw new Error('Failed to fetch bulk request details');
            
            const bulkRequest = await response.json();
            
            const content = `
                <div style="max-height: 70vh; overflow-y: auto;">
                    <div class="request-card-header">
                        <div>
                            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${bulkRequest.requestNumber} - جميع الأجهزة</h3>
                            <span class="status-badge ${this.getStatusClass(bulkRequest.status)}">${this.translateStatus(bulkRequest.status)}</span>
                        </div>
                    </div>
                    <div class="request-details">
                        <div class="request-detail-item"><span class="request-detail-label">اسم العميل</span><span class="request-detail-value">${bulkRequest.customerName}</span></div>
                        <div class="request-detail-item">
                            <span class="request-detail-label">رقم الهاتف</span>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span class="request-detail-value" id="bulkRequestDevicesPhone_${bulkRequest.id}" style="font-weight: 600; color: #3b82f6;">${bulkRequest.customerPhone || '—'}</span>
                                <button type="button" onclick="adminManager.enableBulkRequestPhoneEdit(${bulkRequest.id})" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; white-space: nowrap; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5);">
                                    <i class="fas fa-edit"></i> تعديل
                                </button>
                            </div>
                        </div>
                        <div class="request-detail-item"><span class="request-detail-label">عدد الأجهزة</span><span class="request-detail-value">${bulkRequest.deviceCount}</span></div>
                    </div>

                    <div style="margin-top: 1.5rem;">
                        <button type="button" onclick="adminManager.showAddDeviceModal(${bulkRequest.id})" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <i class="fas fa-plus"></i> إضافة لابتوب جديد
                        </button>
                    </div>

                    <div style="margin-top: 1.5rem;">
                        <h4 style="margin-bottom: 1rem; color: #94a3b8;">الأجهزة</h4>
                        <div style="overflow-x: auto;">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>الماركة</th>
                                        <th>الموديل</th>
                                        <th>الرقم التسلسلي</th>
                                        <th>الحالة</th>
                                        <th>رد الإدارة</th>
                                        <th>التكلفة</th>
                                        <th>الفني</th>
                                        <th>تاريخ الاستلام المتوقع</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${bulkRequest.devices.map((device, index) => `
                                        <tr>
                                            <td style="font-weight: 600;">${device.deviceNumber}</td>
                                            <td>${device.laptopBrand}</td>
                                            <td>${device.laptopModel}</td>
                                            <td dir="ltr" style="color: #94a3b8;">${device.serialNumber || '—'}</td>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                    <span class="status-badge ${this.getStatusClass(device.status)}" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">${this.translateStatus(device.status)}</span>
                                                    <select class="form-select" style="padding: 0.25rem; font-size: 0.8rem; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0, 0, 0, 0.1); width: auto;" onchange="adminManager.updateDeviceStatus(${bulkRequestId}, ${device.id}, this.value)">
                                                        <option value="Received" ${device.status === 'Received' ? 'selected' : ''} style="background-color: rgba(59, 130, 246, 0.9); color: white;">تم الاستلام</option>
                                                        <option value="Waiting Inspection" ${device.status === 'Waiting Inspection' ? 'selected' : ''} style="background-color: rgba(245, 158, 11, 0.9); color: white;">بانتظار الفحص</option>
                                                        <option value="Under Maintenance" ${device.status === 'Under Maintenance' ? 'selected' : ''} style="background-color: rgba(139, 92, 246, 0.9); color: white;">قيد الصيانة</option>
                                                        <option value="Waiting Parts" ${device.status === 'Waiting Parts' ? 'selected' : ''} style="background-color: rgba(239, 68, 68, 0.9); color: white;">بانتظار قطع الغيار</option>
                                                        <option value="Ready" ${device.status === 'Ready' ? 'selected' : ''} style="background-color: rgba(16, 185, 129, 0.9); color: white;">جاهز للتسليم</option>
                                                        <option value="Delivered" ${device.status === 'Delivered' ? 'selected' : ''} style="background-color: rgba(107, 114, 128, 0.9); color: white;">تم التسليم للعميل</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>${device.adminReply || '—'}</td>
                                            <td>${device.cost > 0 ? device.cost : '—'}</td>
                                            <td>${device.technician || '—'}</td>
                                            <td>${device.estimatedCompletionDate ? Utils.formatDate(device.estimatedCompletionDate) : '—'}</td>
                                            <td>
                                                <button class="btn btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;"
                                                        onclick="adminManager.viewBulkDevice(${bulkRequestId}, ${device.id})">
                                                    <i class="fas fa-edit"></i> تعديل
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            const modalId = `view-bulk-devices-${bulkRequestId}`;
            modalManager.create(modalId, 'أجهزة طلب الجملة', content);
            modalManager.open(modalId);
        } catch (error) {
            console.error('Error viewing bulk request devices:', error);
            toast.error('فشل في تحميل الأجهزة');
        }
    }

    /**
     * Update bulk request status directly from table
     */
    async updateBulkRequestStatus(bulkRequestId, newStatus) {
        try {
            // Update only the status field
            const updateResponse = await fetch(`/api/bulk-requests/${bulkRequestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!updateResponse.ok) throw new Error('Failed to update bulk request status');

            toast.success('تم تحديث حالة الطلب بنجاح');
            await this.loadData();
            this.renderBulkRequests();
        } catch (error) {
            console.error('Error updating bulk request status:', error);
            toast.error('فشل تحديث حالة الطلب');
        }
    }

    /**
     * Update company request status directly from table
     */
    async updateCompanyRequestStatus(companyRequestId, newStatus) {
        try {
            const updateResponse = await fetch(`/api/company-requests/${companyRequestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!updateResponse.ok) throw new Error('Failed to update company request status');

            toast.success('تم تحديث حالة الطلب بنجاح');
            await this.loadData();
            this.renderCompanyRequests();
        } catch (error) {
            console.error('Error updating company request status:', error);
            toast.error('فشل تحديث حالة الطلب');
        }
    }

    /**
     * Update request status directly from table
     */
    async updateRequestStatus(requestId, newStatus) {
        try {
            const updateResponse = await fetch(`/api/requests/${requestId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!updateResponse.ok) throw new Error('Failed to update request status');

            // Update local data instead of reloading everything
            const index = this.requests.findIndex(r => r.id === requestId);
            if (index !== -1) {
                this.requests[index].status = newStatus;
                this.renderRequests();
                this.renderStats();
                this.renderCharts();
            }

            toast.success('تم تحديث حالة الطلب بنجاح');
        } catch (error) {
            console.error('Error updating request status:', error);
            toast.error('فشل تحديث حالة الطلب');
        }
    }

    /**
     * Update device status directly from table
     */
    async updateDeviceStatus(bulkRequestId, deviceId, newStatus) {
        try {
            // Update device status using the device-specific endpoint
            const updateResponse = await fetch(`/api/bulk-requests/devices/${deviceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!updateResponse.ok) throw new Error('Failed to update device status');

            // Update local data instead of reloading everything
            const bulkRequestIndex = this.bulkRequests.findIndex(br => br.id === bulkRequestId);
            if (bulkRequestIndex !== -1) {
                const deviceIndex = this.bulkRequests[bulkRequestIndex].devices.findIndex(d => d.id === deviceId);
                if (deviceIndex !== -1) {
                    this.bulkRequests[bulkRequestIndex].devices[deviceIndex].status = newStatus;
                    this.renderBulkRequests();
                }
            }

            toast.success('تم تحديث حالة الجهاز بنجاح');
        } catch (error) {
            console.error('Error updating device status:', error);
            toast.error('فشل تحديث حالة الجهاز');
        }
    }

    /**
     * View bulk device details
     */
    async viewBulkDevice(bulkRequestId, deviceId) {
        try {
            const response = await fetch(`/api/bulk-requests/${bulkRequestId}`);
            if (!response.ok) throw new Error('Failed to fetch bulk request details');
            
            const bulkRequest = await response.json();
            const device = bulkRequest.devices.find(d => d.id === deviceId);
            
            if (!device) {
                toast.error('الجهاز غير موجود');
                return;
            }
            
            const content = `
                <div style="max-height: 70vh; overflow-y: auto;">
                    <div class="request-card-header">
                        <div>
                            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${bulkRequest.requestNumber} - جهاز #${device.deviceNumber}</h3>
                            <span class="status-badge ${this.getStatusClass(device.status)}">${this.translateStatus(device.status)}</span>
                        </div>
                    </div>
                    <div class="request-details">
                        <div class="request-detail-item"><span class="request-detail-label">اسم العميل</span><span class="request-detail-value">${bulkRequest.customerName}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">رقم الهاتف</span><span class="request-detail-value">${bulkRequest.customerPhone}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">الجهاز</span><span class="request-detail-value">${device.laptopBrand} ${device.laptopModel || ''}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">الرقم التسلسلي</span><span class="request-detail-value" dir="ltr">${device.serialNumber || '—'}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">تاريخ الاستلام</span><span class="request-detail-value">${device.receivedDate ? Utils.formatDate(device.receivedDate) : '—'}</span></div>
                        <div class="request-detail-item"><span class="request-detail-label">المشكلة</span><span class="request-detail-value">${device.problemDescription}</span></div>
                    </div>

                    <form id="editBulkDeviceForm" style="margin-top: 1.5rem;">
                        <div class="form-group">
                            <label class="form-label">رقم الهاتف</label>
                            <input type="tel" class="form-input" name="phone" value="${bulkRequest.customerPhone || ''}" placeholder="أدخل رقم الهاتف">
                        </div>
                        <div class="form-group">
                            <label class="form-label">وصف المشكلة</label>
                            <textarea class="form-textarea" name="problemDescription" rows="3">${device.problemDescription || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">رد الإدارة</label>
                            <textarea class="form-textarea" name="adminReply" rows="3">${device.adminReply || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">تكلفة الصيانة (ج.م)</label>
                            <input type="number" class="form-input" name="cost" value="${device.cost || ''}" placeholder="أدخل تكلفة الصيانة" min="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">الفني المسؤول (يمكن اختيار أكثر من فني)</label>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; max-height: 200px; overflow-y: auto; border: 1px solid #374151; border-radius: 0.375rem; padding: 0.5rem;">
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ ابراهيم" ${device.technician && device.technician.includes('استاذ ابراهيم') ? 'checked' : ''}> استاذ ابراهيم
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ محمد شاهين" ${device.technician && device.technician.includes('استاذ محمد شاهين') ? 'checked' : ''}> استاذ محمد شاهين
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="علياء" ${device.technician && device.technician.includes('علياء') ? 'checked' : ''}> علياء
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="سلمي" ${device.technician && device.technician.includes('سلمي') ? 'checked' : ''}> سلمي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة سهير رمزي" ${device.technician && device.technician.includes('استاذة سهير رمزي') ? 'checked' : ''}> استاذة سهير رمزي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة ناديه" ${device.technician && device.technician.includes('استاذة ناديه') ? 'checked' : ''}> استاذة ناديه
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة ام كلثوم" ${device.technician && device.technician.includes('استاذة ام كلثوم') ? 'checked' : ''}> استاذة ام كلثوم
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذة اسماء" ${device.technician && device.technician.includes('استاذة اسماء') ? 'checked' : ''}> استاذة اسماء
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ خالد و عبدالله رضا" ${device.technician && device.technician.includes('استاذ خالد و عبدالله رضا') ? 'checked' : ''}> استاذ خالد و عبدالله رضا
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ محمد علي و عم وليد" ${device.technician && device.technician.includes('استاذ محمد علي و عم وليد') ? 'checked' : ''}> استاذ محمد علي و عم وليد
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="الاستاذ عبد الدالي" ${device.technician && device.technician.includes('الاستاذ عبد الدالي') ? 'checked' : ''}> الاستاذ عبد الدالي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="الاستاذ نادر" ${device.technician && device.technician.includes('الاستاذ نادر') ? 'checked' : ''}> الاستاذ نادر
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="الاستاذ عبدالله موسي" ${device.technician && device.technician.includes('الاستاذ عبدالله موسي') ? 'checked' : ''}> الاستاذ عبدالله موسي
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="استاذ احمد اسلام و احمد طه" ${device.technician && device.technician.includes('استاذ احمد اسلام و احمد طه') ? 'checked' : ''}> استاذ احمد اسلام و احمد طه
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="technician" value="المهندس عبد الفتاح وادم" ${device.technician && device.technician.includes('المهندس عبد الفتاح وادم') ? 'checked' : ''}> المهندس عبد الفتاح وادم
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">تاريخ ووقت الاستلام المتوقع</label>
                            <input type="datetime-local" class="form-input" name="estimatedCompletionDate" value="${device.estimatedCompletionDate ? new Date(device.estimatedCompletionDate).toISOString().slice(0, 16) : ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">حالة الطلب</label>
                            <select class="form-select" name="status">
                                <option value="Received" ${device.status === 'Received' ? 'selected' : ''}>تم الاستلام</option>
                                <option value="Waiting Inspection" ${device.status === 'Waiting Inspection' ? 'selected' : ''}>بانتظار الفحص</option>
                                <option value="Under Maintenance" ${device.status === 'Under Maintenance' ? 'selected' : ''}>قيد الصيانة</option>
                                <option value="Waiting Parts" ${device.status === 'Waiting Parts' ? 'selected' : ''}>بانتظار قطع الغيار</option>
                                <option value="Ready" ${device.status === 'Ready' ? 'selected' : ''}>جاهز للتسليم</option>
                                <option value="Delivered" ${device.status === 'Delivered' ? 'selected' : ''}>تم التسليم للعميل</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ التغييرات</button>
                    </form>
                </div>
            `;
            
            const modalId = `view-bulk-device-${deviceId}`;
            modalManager.create(modalId, 'تفاصيل الجهاز', content);
            modalManager.open(modalId);

            setTimeout(() => {
                const form = document.getElementById('editBulkDeviceForm');
                if (!form) {
                    console.error('Form not found');
                    return;
                }
                
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const estimatedCompletionDateValue = form.estimatedCompletionDate.value;
                    let estimatedCompletionDate = null;
                    if (estimatedCompletionDateValue) {
                        const dateObj = new Date(estimatedCompletionDateValue);
                        if (!isNaN(dateObj.getTime())) {
                            estimatedCompletionDate = dateObj.toISOString();
                        }
                    }
                    
                    // Update device with all fields
                    const deviceUpdateData = {
                        problemDescription: form.problemDescription.value,
                        adminReply: form.adminReply.value,
                        cost: form.cost.value ? parseFloat(form.cost.value) : 0,
                        technician: Array.from(form.querySelectorAll('input[name="technician"]:checked')).map(cb => cb.value).join(' و '),
                        estimatedCompletionDate: estimatedCompletionDate,
                        status: form.status.value
                    };

                    // Update bulk request phone
                    const bulkUpdateData = {
                        customerPhone: form.phone.value
                    };

                    try {
                        // Update device with all fields
                        const deviceResponse = await fetch(`/api/bulk-requests/devices/${deviceId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(deviceUpdateData)
                        });

                        if (!deviceResponse.ok) throw new Error('Failed to update device');

                        // Update bulk request phone
                        const bulkResponse = await fetch(`/api/bulk-requests/${bulkRequestId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(bulkUpdateData)
                        });

                        if (!bulkResponse.ok) throw new Error('Failed to update bulk request');

                        // Update local data
                        const bulkRequestIndex = this.bulkRequests.findIndex(br => br.id === bulkRequestId);
                        if (bulkRequestIndex !== -1) {
                            this.bulkRequests[bulkRequestIndex].customerPhone = bulkUpdateData.customerPhone;
                            const deviceIndex = this.bulkRequests[bulkRequestIndex].devices.findIndex(d => d.id === deviceId);
                            if (deviceIndex !== -1) {
                                this.bulkRequests[bulkRequestIndex].devices[deviceIndex] = {
                                    ...this.bulkRequests[bulkRequestIndex].devices[deviceIndex],
                                    problemDescription: deviceUpdateData.problemDescription,
                                    adminReply: deviceUpdateData.adminReply,
                                    cost: deviceUpdateData.cost,
                                    technician: deviceUpdateData.technician,
                                    estimatedCompletionDate: deviceUpdateData.estimatedCompletionDate,
                                    status: deviceUpdateData.status
                                };
                            }
                        }

                        toast.success('تم تحديث الجهاز بنجاح');
                        modalManager.close(modalId);
                        this.renderBulkRequests();
                    } catch (error) {
                        console.error('Error updating device:', error);
                        toast.error('فشل تحديث الجهاز');
                    }
                });
            }, 100);
        } catch (error) {
            console.error('Error viewing bulk device:', error);
            toast.error('فشل في تحميل تفاصيل الجهاز');
        }
    }

    async viewBulkRequest(bulkRequestId) {
        try {
            const response = await fetch(`/api/bulk-requests/${bulkRequestId}`);
            if (!response.ok) throw new Error('Failed to fetch bulk request details');
            
            const bulkRequest = await response.json();
            
            // Get first device for display details
            const firstDevice = bulkRequest.devices && bulkRequest.devices.length > 0 ? bulkRequest.devices[0] : null;
            
            const content = `
                <div style="max-height: 70vh; overflow-y: auto;">
                    <div class="request-card-header">
                        <div>
                            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${bulkRequest.requestNumber}</h3>
                            <span class="status-badge ${this.getStatusClass(bulkRequest.status)}">${this.translateStatus(bulkRequest.status)}</span>
                    </div>
                </div>
                <div class="request-details">
                    <div class="request-detail-item"><span class="request-detail-label">اسم العميل</span><span class="request-detail-value">${bulkRequest.customerName}</span></div>
                    <div class="request-detail-item">
                        <span class="request-detail-label">رقم الهاتف</span>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span class="request-detail-value" id="bulkRequestPhone_${bulkRequest.id}" style="font-weight: 600; color: #3b82f6;">${bulkRequest.customerPhone || '—'}</span>
                            <button type="button" onclick="adminManager.enableBulkRequestPhoneEdit(${bulkRequest.id})" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; white-space: nowrap; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5);">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                        </div>
                    </div>
                    <div class="request-detail-item"><span class="request-detail-label">الجهاز</span><span class="request-detail-value">${firstDevice ? `${firstDevice.laptopBrand} ${firstDevice.laptopModel || ''}` : '—'}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">الرقم التسلسلي</span><span class="request-detail-value" dir="ltr">${firstDevice ? (firstDevice.serialNumber || '—') : '—'}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">تاريخ الاستلام</span><span class="request-detail-value">${firstDevice ? (firstDevice.receivedDate ? Utils.formatDate(firstDevice.receivedDate) : '—') : '—'}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">تاريخ الطلب</span><span class="request-detail-value">${Utils.formatDate(bulkRequest.createdAt)}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">المشكلة</span><span class="request-detail-value">${firstDevice ? firstDevice.problemDescription : '—'}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">عدد الأجهزة</span><span class="request-detail-value">${bulkRequest.deviceCount}</span></div>
                </div>

                ${bulkRequest.devices && bulkRequest.devices.length > 1 ? `
                <div style="margin-top: 1.5rem;">
                    <h4 style="margin-bottom: 1rem; color: #94a3b8;">جميع الأجهزة</h4>
                    <div style="overflow-x: auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الماركة</th>
                                    <th>الموديل</th>
                                    <th>الرقم التسلسلي</th>
                                    <th>تاريخ الاستلام</th>
                                    <th>الأولوية</th>
                                    <th>المشكلة</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${bulkRequest.devices.map((device, index) => `
                                    <tr>
                                        <td style="font-weight: 600;">${device.deviceNumber}</td>
                                        <td>${device.laptopBrand}</td>
                                        <td>${device.laptopModel}</td>
                                        <td dir="ltr" style="color: #94a3b8;">${device.serialNumber || '—'}</td>
                                        <td>${device.receivedDate ? Utils.formatDate(device.receivedDate) : '—'}</td>
                                        <td><span class="priority-badge ${this.getPriorityClass(device.priority)}">${this.translatePriority(device.priority)}</span></td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${device.problemDescription}</td>
                                        <td><span class="status-badge ${this.getStatusClass(device.status)}">${this.translateStatus(device.status)}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <div style="margin-top: 1.5rem;">
                    <button type="button" onclick="adminManager.showAddDeviceModal(${bulkRequest.id})" class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <i class="fas fa-plus"></i> إضافة لابتوب جديد
                    </button>
                </div>

                <form id="editBulkRequestForm" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label class="form-label">رقم الطلب</label>
                        <input type="text" class="form-input" name="requestNumber" value="${bulkRequest.requestNumber || ''}" readonly style="background: rgba(59, 130, 246, 0.1);">
                    </div>
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف</label>
                        <input type="tel" class="form-input" name="customerPhone" value="${bulkRequest.customerPhone || ''}" placeholder="أدخل رقم الهاتف">
                    </div>
                    <div class="form-group">
                        <label class="form-label">رد الإدارة</label>
                        <textarea class="form-textarea" name="adminReply" rows="3">${bulkRequest.adminReply || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">تكلفة الصيانة (ج.م)</label>
                        <input type="number" class="form-input" name="cost" value="${bulkRequest.cost || ''}" placeholder="أدخل تكلفة الصيانة" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">الفني المسؤول (يمكن اختيار أكثر من فني)</label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; max-height: 200px; overflow-y: auto; border: 1px solid #374151; border-radius: 0.375rem; padding: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ ابراهيم" ${bulkRequest.technician && bulkRequest.technician.includes('استاذ ابراهيم') ? 'checked' : ''}> استاذ ابراهيم
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ محمد شاهين" ${bulkRequest.technician && bulkRequest.technician.includes('استاذ محمد شاهين') ? 'checked' : ''}> استاذ محمد شاهين
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="علياء" ${bulkRequest.technician && bulkRequest.technician.includes('علياء') ? 'checked' : ''}> علياء
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="سلمي" ${bulkRequest.technician && bulkRequest.technician.includes('سلمي') ? 'checked' : ''}> سلمي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة سهير رمزي" ${bulkRequest.technician && bulkRequest.technician.includes('استاذة سهير رمزي') ? 'checked' : ''}> استاذة سهير رمزي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة ناديه" ${bulkRequest.technician && bulkRequest.technician.includes('استاذة ناديه') ? 'checked' : ''}> استاذة ناديه
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة ام كلثوم" ${bulkRequest.technician && bulkRequest.technician.includes('استاذة ام كلثوم') ? 'checked' : ''}> استاذة ام كلثوم
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة اسماء" ${bulkRequest.technician && bulkRequest.technician.includes('استاذة اسماء') ? 'checked' : ''}> استاذة اسماء
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ خالد و عبدالله رضا" ${bulkRequest.technician && bulkRequest.technician.includes('استاذ خالد و عبدالله رضا') ? 'checked' : ''}> استاذ خالد و عبدالله رضا
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ محمد علي و عم وليد" ${bulkRequest.technician && bulkRequest.technician.includes('استاذ محمد علي و عم وليد') ? 'checked' : ''}> استاذ محمد علي و عم وليد
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="الاستاذ عبد الدالي" ${bulkRequest.technician && bulkRequest.technician.includes('الاستاذ عبد الدالي') ? 'checked' : ''}> الاستاذ عبد الدالي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="الاستاذ نادر" ${bulkRequest.technician && bulkRequest.technician.includes('الاستاذ نادر') ? 'checked' : ''}> الاستاذ نادر
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="الاستاذ عبدالله موسي" ${bulkRequest.technician && bulkRequest.technician.includes('الاستاذ عبدالله موسي') ? 'checked' : ''}> الاستاذ عبدالله موسي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ احمد اسلام و احمد طه" ${bulkRequest.technician && bulkRequest.technician.includes('استاذ احمد اسلام و احمد طه') ? 'checked' : ''}> استاذ احمد اسلام و احمد طه
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="المهندس عبد الفتاح وادم" ${bulkRequest.technician && bulkRequest.technician.includes('المهندس عبد الفتاح وادم') ? 'checked' : ''}> المهندس عبد الفتاح وادم
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">تاريخ ووقت الاستلام المتوقع</label>
                        <input type="datetime-local" class="form-input" name="estimatedCompletionDate" value="${bulkRequest.estimatedCompletionDate ? new Date(bulkRequest.estimatedCompletionDate).toISOString().slice(0, 16) : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">تحديث الحالة</label>
                        <select class="form-select" name="status">
                            <option value="Received" ${bulkRequest.status === 'Received' ? 'selected' : ''}>تم الاستلام</option>
                            <option value="Waiting Inspection" ${bulkRequest.status === 'Waiting Inspection' ? 'selected' : ''}>بانتظار الفحص</option>
                            <option value="Under Maintenance" ${bulkRequest.status === 'Under Maintenance' ? 'selected' : ''}>قيد الصيانة</option>
                            <option value="Waiting Parts" ${bulkRequest.status === 'Waiting Parts' ? 'selected' : ''}>بانتظار قطع الغيار</option>
                            <option value="Ready" ${bulkRequest.status === 'Ready' ? 'selected' : ''}>جاهز للتسليم</option>
                            <option value="Delivered" ${bulkRequest.status === 'Delivered' ? 'selected' : ''}>تم التسليم للعميل</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> حفظ التغييرات</button>
                </form>
            </div>
        `;
        
        const modalId = `view-bulk-request-${bulkRequestId}`;
        modalManager.create(modalId, 'تفاصيل طلب الجملة', content);
        modalManager.open(modalId);

        setTimeout(() => {
            const form = document.getElementById('editBulkRequestForm');
            if (!form) {
                console.error('Form not found');
                return;
            }
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const estimatedCompletionDateValue = form.estimatedCompletionDate.value;
                let estimatedCompletionDate = null;
                if (estimatedCompletionDateValue) {
                    const dateObj = new Date(estimatedCompletionDateValue);
                    if (!isNaN(dateObj.getTime())) {
                        estimatedCompletionDate = dateObj.toISOString();
                    }
                }
                
                const updateData = {
                    customerPhone: form.customerPhone.value,
                    adminReply: form.adminReply.value,
                    cost: form.cost.value ? parseFloat(form.cost.value) : 0,
                    technician: Array.from(form.querySelectorAll('input[name="technician"]:checked')).map(cb => cb.value).join(' و '),
                    estimatedCompletionDate: estimatedCompletionDate,
                    status: form.status.value
                };

                try {
                    const response = await fetch(`/api/bulk-requests/${bulkRequestId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updateData)
                    });

                    if (!response.ok) throw new Error('Failed to update bulk request');

                    toast.success('تم تحديث الطلب بنجاح');
                    modalManager.close(modalId);
                    await this.loadData();
                    this.renderBulkRequests();
                } catch (error) {
                    console.error('Error updating bulk request:', error);
                    toast.error('فشل تحديث الطلب');
                }
            });
        }, 100);
        } catch (error) {
            console.error('Error viewing bulk request:', error);
            toast.error('فشل في تحميل تفاصيل طلب الجملة');
        }
    }

    async deleteBulkRequest(bulkRequestId) {
        if (!confirm('هل أنت متأكد من حذف طلب الجملة؟ سيتم نقله إلى سلة المحذوفات ويمكن استعادته.')) {
            return;
        }

        try {
            const response = await fetch(`/api/bulk-requests/${bulkRequestId}/soft-delete`, {
                method: 'PUT'
            });

            if (response.ok) {
                toast.success('تم نقل طلب الجملة إلى سلة المحذوفات');
                await this.loadData();
                this.renderBulkRequests();
            } else {
                throw new Error('Failed to soft delete bulk request');
            }
        } catch (error) {
            console.error('Error soft deleting bulk request:', error);
            toast.error('فشل في حذف طلب الجملة');
        }
    }

    async deleteRequest(requestId) {
        if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ سيتم نقله إلى سلة المحذوفات ويمكن استعادته.')) {
            return;
        }

        try {
            const response = await fetch(`/api/requests/${requestId}/soft-delete`, {
                method: 'PUT'
            });

            if (response.ok) {
                toast.success('تم نقل الطلب إلى سلة المحذوفات');
                await this.loadData();
                this.renderRequests();
            } else {
                throw new Error('Failed to soft delete request');
            }
        } catch (error) {
            console.error('Error soft deleting request:', error);
            toast.error('فشل في حذف الطلب');
        }
    }

    async convertRequestToBulk(requestId) {
        if (!confirm('هل أنت متأكد من تحويل هذا الطلب إلى طلب جملة؟ سيتم نقله من قسم الطلبات العادية إلى قسم طلبات الجملة.')) {
            return;
        }

        try {
            loading.show('جاري تحويل الطلب...');
            const response = await fetch(`/api/requests/${requestId}/convert-to-bulk`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('تم تحويل الطلب إلى طلب جملة بنجاح');
                await this.loadData();
                this.renderRequests();
            } else {
                throw new Error('Failed to convert request');
            }
        } catch (error) {
            console.error('Error converting request to bulk:', error);
            toast.error('فشل في تحويل الطلب');
        } finally {
            loading.hide();
        }
    }

    async convertRequestToCompany(requestId) {
        if (!confirm('هل أنت متأكد من تحويل هذا الطلب إلى طلب موظفي شركة؟ سيتم نقله من قسم الطلبات العادية إلى قسم طلبات موظفي الشركة.')) {
            return;
        }

        try {
            loading.show('جاري تحويل الطلب...');
            const response = await fetch(`/api/requests/${requestId}/convert-to-company`, {
                method: 'POST'
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('تم تحويل الطلب إلى طلب موظفي شركة بنجاح');
                await this.loadData();
                this.renderRequests();
            } else {
                throw new Error('Failed to convert request');
            }
        } catch (error) {
            console.error('Error converting request to company:', error);
            toast.error('فشل في تحويل الطلب');
        } finally {
            loading.hide();
        }
    }

    async showAddDeviceModal(bulkRequestId) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>إضافة لابتوب جديد لطلب الجملة</h3>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="addDeviceForm">
                    <div class="form-group">
                        <label class="form-label">ماركة اللابتوب</label>
                        <select class="form-select" name="laptopBrand" required>
                            <option value="">اختر الماركة</option>
                            <option value="HP">HP</option>
                            <option value="Dell">Dell</option>
                            <option value="Lenovo">Lenovo</option>
                            <option value="Asus">Asus</option>
                            <option value="Acer">Acer</option>
                            <option value="Toshiba">Toshiba</option>
                            <option value="Samsung">Samsung</option>
                            <option value="MSI">MSI</option>
                            <option value="Apple">Apple</option>
                            <option value="Sony">Sony</option>
                            <option value="Other">أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">موديل اللابتوب</label>
                        <input type="text" class="form-input" name="laptopModel" placeholder="أدخل الموديل" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">الرقم التسلسلي (اختياري)</label>
                        <input type="text" class="form-input" name="serialNumber" placeholder="أدخل الرقم التسلسلي">
                    </div>
                    <div class="form-group">
                        <label class="form-label">تاريخ الاستلام</label>
                        <input type="date" class="form-input" name="receivedDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">الأولوية</label>
                        <select class="form-select" name="priority">
                            <option value="Low">منخفضة</option>
                            <option value="Medium" selected>متوسطة</option>
                            <option value="High">عالية</option>
                            <option value="Urgent">عاجلة</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">وصف المشكلة</label>
                        <textarea class="form-textarea" name="problemDescription" rows="3" placeholder="أدخل وصف المشكلة" required></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">التكلفة (اختياري)</label>
                        <input type="number" class="form-input" name="cost" placeholder="أدخل التكلفة" min="0" step="0.01">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">إلغاء</button>
                        <button type="submit" class="btn btn-primary">إضافة اللابتوب</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const form = document.getElementById('addDeviceForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addDeviceToBulkRequest(bulkRequestId, new FormData(form));
            modal.remove();
        });
    }

    /**
     * Add device to existing bulk request
     */
    async addDeviceToBulkRequest(bulkRequestId, formData) {
        const deviceData = {
            laptopBrand: formData.get('laptopBrand'),
            laptopModel: formData.get('laptopModel'),
            serialNumber: formData.get('serialNumber'),
            receivedDate: formData.get('receivedDate'),
            priority: formData.get('priority'),
            problemDescription: formData.get('problemDescription'),
            cost: parseFloat(formData.get('cost')) || 0
        };

        try {
            loading.show('جاري إضافة اللابتوب...');
            const response = await fetch(`/api/bulk-requests/${bulkRequestId}/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deviceData)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('تم إضافة اللابتوب بنجاح');
                await this.loadData();
                this.renderBulkRequests();
                // Refresh the modal to show updated devices
                this.viewBulkRequest(bulkRequestId);
            } else {
                throw new Error('Failed to add device');
            }
        } catch (error) {
            console.error('Error adding device to bulk request:', error);
            toast.error('فشل في إضافة اللابتوب');
        } finally {
            loading.hide();
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0;">الطلبات (${filteredRequests.length})</h3>
                <button class="btn btn-danger" onclick="adminManager.deleteAllRequests()" style="padding: 0.5rem 1rem;">
                    <i class="fas fa-trash"></i> حذف الكل
                </button>
            </div>
            <div class="table-container" style="overflow-x: auto;">
                <table class="table" style="min-width: 1000px;">
                    <thead>
                        <tr>
                            <th class="table-hide-mobile">Request #</th>
                            <th>Customer</th>
                            <th class="table-hide-mobile">Phone</th>
                            <th>Device</th>
                            <th>Status</th>
                            <th class="table-hide-mobile">Priority</th>
                            <th class="table-hide-mobile">Cost</th>
                            <th>Technician</th>
                            <th class="table-hide-mobile">Received</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(request => `
                            <tr>
                                <td class="table-hide-mobile"><strong>${request.requestNumber}</strong></td>
                                <td>${request.fullName}</td>
                                <td class="table-hide-mobile" dir="ltr">${request.phone}</td>
                                <td>
                                    <div>${request.laptopBrand} ${request.laptopModel || ''}</div>
                                    ${request.serialNumber && request.serialNumber !== 'N/A' ? `<div style="font-size: 0.875rem; color: #94a3b8;" dir="ltr">SN: ${request.serialNumber}</div>` : ''}
                                </td>
                                <td>
                                    <select class="form-select" style="padding: 0.25rem; font-size: 0.8rem; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(0, 0, 0, 0.1);" onchange="adminManager.updateRequestStatus(${request.id}, this.value)">
                                        <option value="Received" ${request.status === 'Received' ? 'selected' : ''} style="background-color: rgba(59, 130, 246, 0.9); color: white;">تم الاستلام</option>
                                        <option value="Waiting Inspection" ${request.status === 'Waiting Inspection' ? 'selected' : ''} style="background-color: rgba(245, 158, 11, 0.9); color: white;">بانتظار الفحص</option>
                                        <option value="Under Maintenance" ${request.status === 'Under Maintenance' ? 'selected' : ''} style="background-color: rgba(139, 92, 246, 0.9); color: white;">قيد الصيانة</option>
                                        <option value="Waiting Parts" ${request.status === 'Waiting Parts' ? 'selected' : ''} style="background-color: rgba(239, 68, 68, 0.9); color: white;">بانتظار قطع الغيار</option>
                                        <option value="Ready" ${request.status === 'Ready' ? 'selected' : ''} style="background-color: rgba(16, 185, 129, 0.9); color: white;">جاهز للتسليم</option>
                                        <option value="Delivered" ${request.status === 'Delivered' ? 'selected' : ''} style="background-color: rgba(107, 114, 128, 0.9); color: white;">تم التسليم للعميل</option>
                                    </select>
                                </td>
                                <td class="table-hide-mobile">${this.translatePriority(request.priority)}</td>
                                <td class="table-hide-mobile">${request.cost > 0 ? Utils.formatCurrency(request.cost) : '—'}</td>
                                <td>${request.technician || '—'}</td>
                                <td class="table-hide-mobile">${request.receivedDate || '—'}</td>
                                <td>
                                    <button class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;"
                                            onclick="adminManager.viewRequest(${request.id})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.quickEditRequest(${request.id})" title="تعديل سريع">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.convertRequestToBulk(${request.id})" title="تحويل لطلب جملة">
                                        <i class="fas fa-boxes"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.convertRequestToCompany(${request.id})" title="تحويل لطلب موظفي شركة">
                                        <i class="fas fa-building"></i>
                                    </button>
                                    <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                            onclick="adminManager.deleteRequest(${request.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div id="requestsPagination"></div>
        `;

        this.renderPagination('requestsPagination', pages);
    }

    /**
     * Filter requests with advanced search
     */
    filterRequests() {
        let filtered = [...this.requests];
        const searchTerm = document.getElementById('requestSearch')?.value?.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || 'All';
        const brandFilter = document.getElementById('brandFilter')?.value || 'All';
        const priorityFilter = document.getElementById('priorityFilter')?.value || 'All';
        const dateFrom = document.getElementById('dateFrom')?.value || '';
        const dateTo = document.getElementById('dateTo')?.value || '';

        if (searchTerm) {
            // reset special filter on manual search
            this._specialFilter = null;
            filtered = filtered.filter(r =>
                r.requestNumber.toLowerCase().includes(searchTerm) ||
                r.fullName.toLowerCase().includes(searchTerm) ||
                r.phone.includes(searchTerm) ||
                (r.laptopBrand && r.laptopBrand.toLowerCase().includes(searchTerm)) ||
                (r.laptopModel && r.laptopModel.toLowerCase().includes(searchTerm)) ||
                (r.problemDescription && r.problemDescription.toLowerCase().includes(searchTerm))
            );
        }

        const activeFilter = this._specialFilter || statusFilter;

        if (activeFilter === 'today') {
            // Include all request types for today's filter - rebuilt from scratch
            // Use local date string comparison to avoid timezone issues
            const today = new Date().toDateString();

            console.log('📅 Today filter - Today date (local):', today);
            console.log('📅 Total normal requests:', this.requests.length);

            // Get all today's requests from all types
            const allTodayRequests = [];

            // Normal requests - log ALL requests to debug
            this.requests.forEach(r => {
                const requestDate = new Date(r.createdAt).toDateString();
                console.log('📅 Normal request:', r.requestNumber, 'Date:', r.createdAt, 'Date string:', requestDate, 'Matches today:', requestDate === today);
                if (requestDate === today) {
                    console.log('📅 Adding normal request:', r.requestNumber, r.createdAt);
                    allTodayRequests.push({
                        ...r,
                        isBulk: false,
                        isCompany: false
                    });
                }
            });

            // Bulk requests
            this.bulkRequests.forEach(r => {
                const requestDate = new Date(r.createdAt).toDateString();
                if (requestDate === today) {
                    console.log('📅 Adding bulk request:', r.requestNumber, r.createdAt);
                    allTodayRequests.push({
                        ...r,
                        requestNumber: r.requestNumber,
                        fullName: r.customerName,
                        phone: r.customerPhone,
                        laptopBrand: r.devices?.[0]?.laptopBrand || '',
                        laptopModel: r.devices?.[0]?.laptopModel || '',
                        problemDescription: r.devices?.[0]?.problemDescription || '',
                        status: r.status,
                        createdAt: r.createdAt,
                        isBulk: true,
                        isCompany: false
                    });
                }
            });

            // Company requests
            this.companyRequests.forEach(r => {
                const requestDate = new Date(r.createdAt).toDateString();
                if (requestDate === today) {
                    console.log('📅 Adding company request:', r.requestNumber, r.createdAt);
                    allTodayRequests.push({
                        ...r,
                        requestNumber: r.requestNumber,
                        fullName: r.companyName || r.full_name || r.fullName,
                        phone: r.companyPhone || r.phone,
                        laptopBrand: r.laptopBrand || r.laptop_brand,
                        laptopModel: r.laptopModel || r.laptop_model,
                        problemDescription: r.problemDescription || r.problem_description,
                        status: r.status,
                        createdAt: r.createdAt,
                        isBulk: false,
                        isCompany: true
                    });
                }
            });

            console.log('📅 Total today requests:', allTodayRequests.length);
            filtered = allTodayRequests;
        } else if (activeFilter === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            filtered = filtered.filter(r => new Date(r.createdAt).toDateString() === yesterday.toDateString());
        } else if (activeFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filtered = filtered.filter(r => new Date(r.createdAt) >= weekAgo);
        } else if (activeFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filtered = filtered.filter(r => new Date(r.createdAt) >= monthAgo);
        } else if (activeFilter === 'open') {
            filtered = filtered.filter(r => r.status !== 'Delivered');
        } else if (activeFilter === 'completed') {
            filtered = filtered.filter(r => r.status === 'Delivered');
        } else if (activeFilter !== 'All') {
            filtered = filtered.filter(r => r.status === activeFilter);
        }

        // Brand filter
        if (brandFilter !== 'All') {
            filtered = filtered.filter(r => r.laptopBrand === brandFilter);
        }

        // Priority filter
        if (priorityFilter !== 'All') {
            filtered = filtered.filter(r => r.priority === priorityFilter);
        }

        // Date range filter
        if (dateFrom) {
            filtered = filtered.filter(r => new Date(r.createdAt) >= new Date(dateFrom));
        }
        if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => new Date(r.createdAt) <= toDate);
        }

        return filtered;
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('requestSearch').value = '';
        document.getElementById('statusFilter').value = 'All';
        document.getElementById('brandFilter').value = 'All';
        document.getElementById('priorityFilter').value = 'All';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        this.currentPage = 1;
        this.renderRequests();
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
                    if (filter === 'open' || filter === 'today' || filter === 'completed') {
                        statusFilter.value = 'All'; // will be handled by filterRequests
                    } else {
                        statusFilter.value = filter;
                    }
                    // Store special filter
                    this._specialFilter = (filter === 'open' || filter === 'today' || filter === 'completed') ? filter : null;
                    this.renderRequests();
                }
            }, 50);
        }
    }

    viewRequest(requestId) {
        const request = this.requests.find(r => r.id === requestId);
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
                    <div class="request-detail-item">
                        <span class="request-detail-label">رقم الهاتف</span>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span class="request-detail-value" id="requestPhone_${request.id}">${request.phone}</span>
                            <button type="button" onclick="adminManager.enableRequestPhoneEdit(${request.id})" class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; white-space: nowrap; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.5);">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                        </div>
                    </div>
                    <div class="request-detail-item"><span class="request-detail-label">الجهاز</span><span class="request-detail-value">${request.laptopBrand} ${request.laptopModel || ''}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">الرقم التسلسلي</span><span class="request-detail-value" dir="ltr">${request.serialNumber || '—'}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">تاريخ الاستلام</span><span class="request-detail-value">${request.receivedDate || '—'}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">تاريخ الطلب</span><span class="request-detail-value">${Utils.formatDate(request.createdAt)}</span></div>
                    <div class="request-detail-item"><span class="request-detail-label">المشكلة</span><span class="request-detail-value">${request.problemDescription}</span></div>
                    ${request.deviceImage ? `
                    <div class="request-detail-item" style="grid-column: 1 / -1;">
                        <span class="request-detail-label">صورة الجهاز</span>
                        <div style="margin-top: 0.5rem;">
                            <img src="${request.deviceImage}" alt="صورة الجهاز" style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                        </div>
                    </div>
                    ` : ''}
                </div>
                <form id="editRequestForm" style="margin-top: 1.5rem;">
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف</label>
                        <input type="tel" class="form-input" name="phone" value="${request.phone || ''}" placeholder="أدخل رقم الهاتف">
                    </div>
                    <div class="form-group">
                        <label class="form-label">وصف المشكلة</label>
                        <textarea class="form-textarea" name="problemDescription" rows="3">${request.problemDescription || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">رد الإدارة</label>
                        <textarea class="form-textarea" name="adminReply" rows="3">${request.adminReply || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">تكلفة الصيانة (ج.م)</label>
                        <input type="number" class="form-input" name="cost" value="${request.cost || ''}" placeholder="أدخل تكلفة الصيانة" min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">الفني المسؤول (يمكن اختيار أكثر من فني)</label>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; max-height: 200px; overflow-y: auto; border: 1px solid #374151; border-radius: 0.375rem; padding: 0.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ ابراهيم" ${request.technician && request.technician.includes('استاذ ابراهيم') ? 'checked' : ''}> استاذ ابراهيم
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ محمد شاهين" ${request.technician && request.technician.includes('استاذ محمد شاهين') ? 'checked' : ''}> استاذ محمد شاهين
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="علياء" ${request.technician && request.technician.includes('علياء') ? 'checked' : ''}> علياء
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="سلمي" ${request.technician && request.technician.includes('سلمي') ? 'checked' : ''}> سلمي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة سهير رمزي" ${request.technician && request.technician.includes('استاذة سهير رمزي') ? 'checked' : ''}> استاذة سهير رمزي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة ناديه" ${request.technician && request.technician.includes('استاذة ناديه') ? 'checked' : ''}> استاذة ناديه
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة ام كلثوم" ${request.technician && request.technician.includes('استاذة ام كلثوم') ? 'checked' : ''}> استاذة ام كلثوم
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذة اسماء" ${request.technician && request.technician.includes('استاذة اسماء') ? 'checked' : ''}> استاذة اسماء
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ خالد و عبدالله رضا" ${request.technician && request.technician.includes('استاذ خالد و عبدالله رضا') ? 'checked' : ''}> استاذ خالد و عبدالله رضا
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ محمد علي و عم وليد" ${request.technician && request.technician.includes('استاذ محمد علي و عم وليد') ? 'checked' : ''}> استاذ محمد علي و عم وليد
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="الاستاذ عبد الدالي" ${request.technician && request.technician.includes('الاستاذ عبد الدالي') ? 'checked' : ''}> الاستاذ عبد الدالي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="الاستاذ نادر" ${request.technician && request.technician.includes('الاستاذ نادر') ? 'checked' : ''}> الاستاذ نادر
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="الاستاذ عبدالله موسي" ${request.technician && request.technician.includes('الاستاذ عبدالله موسي') ? 'checked' : ''}> الاستاذ عبدالله موسي
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="استاذ احمد اسلام و احمد طه" ${request.technician && request.technician.includes('استاذ احمد اسلام و احمد طه') ? 'checked' : ''}> استاذ احمد اسلام و احمد طه
                            </label>
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="technician" value="المهندس عبد الفتاح وادم" ${request.technician && request.technician.includes('المهندس عبد الفتاح وادم') ? 'checked' : ''}> المهندس عبد الفتاح وادم
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">تاريخ ووقت الاستلام المتوقع</label>
                        <input type="datetime-local" class="form-input" name="estimatedCompletionDate" value="${request.estimatedCompletionDate ? new Date(request.estimatedCompletionDate).toISOString().slice(0, 16) : ''}">
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
            const estimatedCompletionDateValue = form.estimatedCompletionDate.value;
            // Convert datetime-local to ISO string
            let estimatedCompletionDate = null;
            if (estimatedCompletionDateValue) {
                const dateObj = new Date(estimatedCompletionDateValue);
                if (!isNaN(dateObj.getTime())) {
                    estimatedCompletionDate = dateObj.toISOString();
                }
            }

            const updateData = {
                phone: form.phone.value,
                problemDescription: form.problemDescription.value,
                adminReply: form.adminReply.value,
                cost: parseFloat(form.cost.value) || 0,
                technician: Array.from(form.querySelectorAll('input[name="technician"]:checked')).map(cb => cb.value).join(' و '),
                estimatedCompletionDate: estimatedCompletionDate,
                status: form.status.value
            };

            console.log('📝 Updating request with data:', updateData);

            // Auto-set estimated completion date if admin replies and no date is set
            if (updateData.adminReply && !updateData.estimatedCompletionDate) {
                const today = new Date();
                today.setDate(today.getDate() + 3); // Default to 3 days from now
                updateData.estimatedCompletionDate = today.toISOString();
                form.estimatedCompletionDate.value = today.toISOString().slice(0, 16);
            }

            this.updateRequest(requestId, updateData);
        });
    }

    /**
     * Enable phone number editing in request details
     */
    enableRequestPhoneEdit(requestId) {
        const phoneSpan = document.getElementById(`requestPhone_${requestId}`);
        if (phoneSpan) {
            const currentPhone = phoneSpan.textContent;
            const input = document.createElement('input');
            input.type = 'tel';
            input.value = currentPhone;
            input.className = 'form-input';
            input.style.padding = '0.25rem 0.5rem';
            input.style.fontSize = '0.875rem';
            input.style.minWidth = '150px';
            
            phoneSpan.replaceWith(input);
            input.focus();
            
            input.addEventListener('blur', async () => {
                const newPhone = input.value.trim();
                if (newPhone && newPhone !== currentPhone) {
                    try {
                        const response = await fetch(`/api/requests/${requestId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: newPhone })
                        });
                        
                        if (response.ok) {
                            const newSpan = document.createElement('span');
                            newSpan.className = 'request-detail-value';
                            newSpan.id = `requestPhone_${requestId}`;
                            newSpan.textContent = newPhone;
                            input.replaceWith(newSpan);
                            
                            // Refresh data
                            await this.loadData();
                            this.renderRequests();
                        }
                    } catch (error) {
                        console.error('Error updating phone:', error);
                        input.value = currentPhone;
                    }
                } else {
                    const newSpan = document.createElement('span');
                    newSpan.className = 'request-detail-value';
                    newSpan.id = `requestPhone_${requestId}`;
                    newSpan.textContent = currentPhone;
                    input.replaceWith(newSpan);
                }
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        }
    }

    /**
     * Enable phone number editing in bulk request details
     */
    enableBulkRequestPhoneEdit(bulkRequestId) {
        console.log('📞 enableBulkRequestPhoneEdit called for ID:', bulkRequestId);
        // Try both possible IDs
        let phoneSpan = document.getElementById(`bulkRequestPhone_${bulkRequestId}`);
        let spanId = `bulkRequestPhone_${bulkRequestId}`;

        if (!phoneSpan) {
            phoneSpan = document.getElementById(`bulkRequestDevicesPhone_${bulkRequestId}`);
            spanId = `bulkRequestDevicesPhone_${bulkRequestId}`;
        }

        console.log('📞 phoneSpan found:', phoneSpan);
        if (phoneSpan) {
            const currentPhone = phoneSpan.textContent;
            console.log('📞 currentPhone:', currentPhone);
            const input = document.createElement('input');
            input.type = 'tel';
            input.value = currentPhone;
            input.className = 'form-input';
            input.style.padding = '0.25rem 0.5rem';
            input.style.fontSize = '0.875rem';
            input.style.minWidth = '150px';

            phoneSpan.replaceWith(input);
            input.focus();

            input.addEventListener('blur', async () => {
                const newPhone = input.value.trim();
                console.log('📞 newPhone:', newPhone);
                if (newPhone && newPhone !== currentPhone) {
                    try {
                        console.log('📞 Sending update to server:', { customerPhone: newPhone });
                        const response = await fetch(`/api/bulk-requests/${bulkRequestId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ customerPhone: newPhone })
                        });
                        console.log('📞 Response status:', response.status);

                        if (response.ok) {
                            const newSpan = document.createElement('span');
                            newSpan.className = 'request-detail-value';
                            newSpan.id = spanId;
                            newSpan.textContent = newPhone;
                            input.replaceWith(newSpan);

                            // Refresh data
                            await this.loadData();
                            this.renderBulkRequests();
                        } else {
                            console.error('📞 Server returned error:', response.status);
                            input.value = currentPhone;
                        }
                    } catch (error) {
                        console.error('📞 Error updating phone:', error);
                        input.value = currentPhone;
                    }
                } else {
                    const newSpan = document.createElement('span');
                    newSpan.className = 'request-detail-value';
                    newSpan.id = spanId;
                    newSpan.textContent = currentPhone;
                    input.replaceWith(newSpan);
                }
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        } else {
            console.error('📞 phoneSpan not found for IDs:', `bulkRequestPhone_${bulkRequestId}`, `bulkRequestDevicesPhone_${bulkRequestId}`);
        }
    }

    /**
     * Enable phone number editing in company request details
     */
    enableCompanyRequestPhoneEdit(companyRequestId) {
        const phoneSpan = document.getElementById(`companyRequestPhone_${companyRequestId}`);
        if (phoneSpan) {
            const currentPhone = phoneSpan.textContent;
            const input = document.createElement('input');
            input.type = 'tel';
            input.value = currentPhone;
            input.className = 'form-input';
            input.style.padding = '0.25rem 0.5rem';
            input.style.fontSize = '0.875rem';
            input.style.minWidth = '150px';
            
            phoneSpan.replaceWith(input);
            input.focus();
            
            input.addEventListener('blur', async () => {
                const newPhone = input.value.trim();
                if (newPhone && newPhone !== currentPhone) {
                    try {
                        const response = await fetch(`/api/company-requests/${companyRequestId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: newPhone })
                        });
                        
                        if (response.ok) {
                            const newSpan = document.createElement('span');
                            newSpan.className = 'request-detail-value';
                            newSpan.id = `companyRequestPhone_${companyRequestId}`;
                            newSpan.textContent = newPhone;
                            input.replaceWith(newSpan);
                            
                            // Refresh data
                            await this.loadData();
                            this.renderCompanyRequests();
                        }
                    } catch (error) {
                        console.error('Error updating phone:', error);
                        input.value = currentPhone;
                    }
                } else {
                    const newSpan = document.createElement('span');
                    newSpan.className = 'request-detail-value';
                    newSpan.id = `companyRequestPhone_${companyRequestId}`;
                    newSpan.textContent = currentPhone;
                    input.replaceWith(newSpan);
                }
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        }
    }

    async updateRequest(requestId, data) {
        // Use same-origin API (Vercel handles both frontend and backend)
        const apiUrl = '/api/requests';
        console.log('📡 Sending PUT request to:', `${apiUrl}/${requestId}`);
        console.log('📡 Request data:', data);

        const response = await fetch(`${apiUrl}/${requestId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
            const updatedData = await response.json();
            
            // Update local data instead of reloading everything
            const index = this.requests.findIndex(r => r.id === requestId);
            if (index !== -1) {
                this.requests[index] = { ...this.requests[index], ...updatedData };
                this.renderRequests();
                this.renderStats();
                this.renderCharts();
            }
            
            modalManager.close('view-request');
            toast.success('تم تحديث الطلب بنجاح');
        } else {
            const errorText = await response.text();
            console.error('❌ Update request failed:', errorText);
            toast.error('فشل تحديث الطلب: ' + errorText);
        }
    }

    /**
     * Quick edit request from dashboard
     */
    async quickEditRequest(requestId) {
        const request = this.requests.find(r => r.id === requestId);
        if (!request) return;

        const content = `
            <form id="quickEditForm" style="padding: 1rem;">
                <div class="form-group">
                    <label class="form-label">رقم الهاتف</label>
                    <input type="tel" class="form-input" name="phone" value="${request.phone || ''}" placeholder="أدخل رقم الهاتف">
                </div>
                <div class="form-group">
                    <label class="form-label">وصف المشكلة</label>
                    <textarea class="form-textarea" name="problemDescription" rows="4">${request.problemDescription || ''}</textarea>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="modalManager.close('quick-edit')">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        modalManager.create('quick-edit', 'تعديل سريع', content);
        modalManager.open('quick-edit');

        const form = document.getElementById('quickEditForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updateData = {
                phone: form.phone.value,
                problem_description: form.problemDescription.value
            };

            try {
                const response = await fetch(`/api/requests/${requestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    toast.success('تم تحديث الطلب بنجاح');
                    modalManager.close('quick-edit');
                    await this.loadData();
                    this.renderRequests();
                } else {
                    throw new Error('Failed to update');
                }
            } catch (error) {
                toast.error('فشل تحديث الطلب');
            }
        });
    }

    /**
     * Quick edit bulk request from dashboard
     */
    async quickEditBulkRequest(bulkRequestId) {
        const bulkRequest = this.bulkRequests.find(br => br.id === bulkRequestId);
        if (!bulkRequest) return;

        const content = `
            <form id="quickEditBulkForm" style="padding: 1rem;">
                <div class="form-group">
                    <label class="form-label">رقم الهاتف</label>
                    <input type="tel" class="form-input" name="phone" value="${bulkRequest.customerPhone || ''}" placeholder="أدخل رقم الهاتف">
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="modalManager.close('quick-edit-bulk')">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        modalManager.create('quick-edit-bulk', 'تعديل سريع', content);
        modalManager.open('quick-edit-bulk');

        const form = document.getElementById('quickEditBulkForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updateData = {
                customer_phone: form.phone.value
            };

            try {
                const response = await fetch(`/api/bulk-requests/${bulkRequestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    toast.success('تم تحديث الطلب بنجاح');
                    modalManager.close('quick-edit-bulk');
                    await this.loadData();
                    this.renderBulkRequests();
                } else {
                    throw new Error('Failed to update');
                }
            } catch (error) {
                toast.error('فشل تحديث الطلب');
            }
        });
    }

    /**
     * Quick edit company request from dashboard
     */
    async quickEditCompanyRequest(companyRequestId) {
        const companyRequest = this.companyRequests.find(cr => cr.id === companyRequestId);
        if (!companyRequest) return;

        const content = `
            <form id="quickEditCompanyForm" style="padding: 1rem;">
                <div class="form-group">
                    <label class="form-label">رقم الهاتف</label>
                    <input type="tel" class="form-input" name="phone" value="${companyRequest.phone || ''}" placeholder="أدخل رقم الهاتف">
                </div>
                <div class="form-group">
                    <label class="form-label">وصف المشكلة</label>
                    <textarea class="form-textarea" name="problemDescription" rows="4">${companyRequest.problem_description || companyRequest.problemDescription || ''}</textarea>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="modalManager.close('quick-edit-company')">إلغاء</button>
                    <button type="submit" class="btn btn-primary">حفظ</button>
                </div>
            </form>
        `;

        modalManager.create('quick-edit-company', 'تعديل سريع', content);
        modalManager.open('quick-edit-company');

        const form = document.getElementById('quickEditCompanyForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updateData = {
                phone: form.phone.value,
                problem_description: form.problemDescription.value
            };

            try {
                const response = await fetch(`/api/company-requests/${companyRequestId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    toast.success('تم تحديث الطلب بنجاح');
                    modalManager.close('quick-edit-company');
                    await this.loadData();
                    this.renderCompanyRequests();
                } else {
                    throw new Error('Failed to update');
                }
            } catch (error) {
                toast.error('فشل تحديث الطلب');
            }
        });
    }

    /**
     * Render trash section
     */
    async renderTrash() {
        const container = document.getElementById('trashContainer');
        if (!container) return;

        container.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6;"></i><p style="margin-top: 1rem; color: #94a3b8;">جاري تحميل سلة المحذوفات...</p></div>';

        try {
            // Fetch deleted items from all request types
            const [deletedRequestsRes, deletedBulkRequestsRes, deletedCompanyRequestsRes] = await Promise.all([
                fetch('/api/requests/trash').then(async r => {
                    if (!r.ok) {
                        console.error('Error fetching trash requests:', r.status);
                        return [];
                    }
                    const data = await r.json();
                    return Array.isArray(data) ? data : [];
                }).catch(() => []),
                fetch('/api/bulk-requests/trash').then(async r => {
                    if (!r.ok) {
                        console.error('Error fetching trash bulk requests:', r.status);
                        return [];
                    }
                    const data = await r.json();
                    return Array.isArray(data) ? data : [];
                }).catch(() => []),
                fetch('/api/company-requests/trash').then(async r => {
                    if (!r.ok) {
                        console.error('Error fetching trash company requests:', r.status);
                        return [];
                    }
                    const data = await r.json();
                    return Array.isArray(data) ? data : [];
                }).catch(() => [])
            ]);

            const allDeleted = [
                ...deletedRequestsRes.map(r => ({ ...r, type: 'request', displayName: `طلب #${r.requestNumber}` })),
                ...deletedBulkRequestsRes.map(r => ({ ...r, type: 'bulk', displayName: `طلب جملة #${r.requestNumber}` })),
                ...deletedCompanyRequestsRes.map(r => ({ ...r, type: 'company', displayName: `طلب شركة #${r.requestNumber}` }))
            ];

            // Sort by deleted date (newest first)
            allDeleted.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

            if (allDeleted.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-trash"></i>
                        <h3>سلة المحذوفات فارغة</h3>
                        <p>لا توجد عناصر محذوفة حالياً.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>النوع</th>
                                <th>رقم الطلب</th>
                                <th>الاسم/العميل</th>
                                <th>تاريخ الحذف</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allDeleted.map(item => `
                                <tr>
                                    <td>
                                        <span style="font-weight: 600; color: ${item.type === 'request' ? '#3b82f6' : item.type === 'bulk' ? '#10b981' : '#f59e0b'};">
                                            ${item.type === 'request' ? 'طلب عادي' : item.type === 'bulk' ? 'طلب جملة' : 'طلب شركة'}
                                        </span>
                                    </td>
                                    <td style="font-weight: 600;">${item.requestNumber || item.request_number}</td>
                                    <td>${item.type === 'request' ? item.fullName : item.customerName || item.full_name}</td>
                                    <td>${Utils.formatDate(item.deletedAt)}</td>
                                    <td>
                                        <button class="btn btn-success" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;"
                                                onclick="adminManager.restoreItem('${item.type}', ${item.id})">
                                            <i class="fas fa-undo"></i> استعادة
                                        </button>
                                        <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;"
                                                onclick="adminManager.permanentDeleteItem('${item.type}', ${item.id})">
                                            <i class="fas fa-trash-alt"></i> حذف نهائي
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading trash:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>خطأ في التحميل</h3>
                    <p>فشل تحميل سلة المحذوفات. يرجى المحاولة مرة أخرى.</p>
                </div>
            `;
        }
    }

    /**
     * Restore deleted item
     */
    async restoreItem(type, id) {
        if (!confirm('هل أنت متأكد من استعادة هذا العنصر؟')) {
            return;
        }

        try {
            let endpoint;
            switch (type) {
                case 'request':
                    endpoint = `/api/requests/${id}/restore`;
                    break;
                case 'bulk':
                    endpoint = `/api/bulk-requests/${id}/restore`;
                    break;
                case 'company':
                    endpoint = `/api/company-requests/${id}/restore`;
                    break;
            }

            const response = await fetch(endpoint, {
                method: 'PUT'
            });

            if (response.ok) {
                toast.success('تم استعادة العنصر بنجاح');
                await this.loadData();
                this.renderTrash();
            } else {
                throw new Error('Failed to restore item');
            }
        } catch (error) {
            console.error('Error restoring item:', error);
            toast.error('فشل استعادة العنصر');
        }
    }

    /**
     * Permanently delete item
     */
    async permanentDeleteItem(type, id) {
        if (!confirm('هل أنت متأكد من الحذف النهائي؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            return;
        }

        try {
            let endpoint;
            switch (type) {
                case 'request':
                    endpoint = `/api/requests/${id}`;
                    break;
                case 'bulk':
                    endpoint = `/api/bulk-requests/${id}`;
                    break;
                case 'company':
                    endpoint = `/api/company-requests/${id}`;
                    break;
            }

            const response = await fetch(endpoint, {
                method: 'DELETE'
            });

            if (response.ok) {
                toast.success('تم الحذف النهائي بنجاح');
                await this.loadData();
                this.renderTrash();
            } else {
                throw new Error('Failed to permanently delete item');
            }
        } catch (error) {
            console.error('Error permanently deleting item:', error);
            toast.error('فشل الحذف النهائي');
        }
    }

    async deleteRequest(requestId) {
        const request = this.requests.find(r => r.id === requestId);
        if (!request) return;

        const content = `
            <div style="text-align: center; padding: 1rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f59e0b; margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">تأكيد الحذف</h3>
                <p style="color: #94a3b8; margin-bottom: 1rem;">هل أنت متأكد من حذف الطلب رقم <strong>${request.requestNumber}</strong>؟</p>
                <p style="color: #94a3b8; font-size: 0.875rem;">سيتم نقله إلى سلة المحذوفات ويمكن استعادته.</p>
            </div>
        `;

        modalManager.create('confirm-delete-request', 'تأكيد الحذف', content, async () => {
            try {
                console.log('🗑️ Soft deleting request ID:', requestId);
                const response = await fetch(`/api/requests/${requestId}/soft-delete`, {
                    method: 'PUT'
                });

                console.log('📡 Soft delete response status:', response.status);

                if (response.ok) {
                    this.loadData();
                    this.renderRequests();
                    this.renderStats();
                    this.renderCharts();
                    toast.success('تم نقل الطلب إلى سلة المحذوفات');
                } else {
                    const errorText = await response.text();
                    console.error('❌ Delete failed:', errorText);
                    toast.error('فشل حذف الطلب');
                }
            } catch (error) {
                console.error('❌ Delete error:', error);
                toast.error('فشل حذف الطلب');
            }
        });

        modalManager.open('confirm-delete-request');
    }

    async deleteAllRequests() {
        const content = `
            <div>
                <p style="margin-bottom: 1rem; color: #ef4444; font-weight: 600;">⚠️ تحذير: هذا الإجراء سيحذف جميع الطلبات!</p>
                <p style="margin-bottom: 1rem;">هل أنت متأكد من حذف جميع الطلبات؟ هذا الإجراء لا يمكن التراجع عنه.</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="modalManager.close('delete-all-requests')">إلغاء</button>
                    <button class="btn btn-danger" onclick="adminManager.confirmDeleteAllRequests()">حذف الكل</button>
                </div>
            </div>
        `;

        modalManager.create('delete-all-requests', 'حذف جميع الطلبات', content);
        modalManager.open('delete-all-requests');
    }

    async confirmDeleteAllRequests() {
        try {
            console.log('🗑️ Deleting all requests');
            const apiUrl = '/api/requests';
            const response = await fetch(apiUrl, {
                method: 'DELETE'
            });

            console.log('📡 Delete all response status:', response.status);

            if (response.ok) {
                this.loadData();
                this.renderRequests();
                modalManager.close('delete-all-requests');
                toast.success('تم حذف جميع الطلبات بنجاح');
            } else {
                const errorText = await response.text();
                console.error('❌ Delete all failed:', errorText);
                toast.error('فشل حذف جميع الطلبات');
            }
        } catch (error) {
            console.error('❌ Delete all error:', error);
            toast.error('فشل حذف جميع الطلبات');
        }
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

    getStatusBackgroundColor(status) {
        const colors = {
            'Received': 'rgba(30, 64, 175, 0.2)',
            'Waiting Inspection': 'rgba(180, 83, 9, 0.2)',
            'Under Maintenance': 'rgba(88, 28, 135, 0.2)',
            'Waiting Parts': 'rgba(127, 29, 29, 0.2)',
            'Ready': 'rgba(5, 150, 105, 0.2)',
            'Delivered': 'rgba(22, 101, 52, 0.2)'
        };
        return colors[status] || 'rgba(30, 64, 175, 0.2)';
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

    getPriorityClass(priority) {
        const classes = {
            'Low': 'priority-low',
            'Medium': 'priority-medium',
            'High': 'priority-high',
            'Urgent': 'priority-urgent'
        };
        return classes[priority] || 'priority-medium';
    }

    /**
     * Generate report based on selected period
     */
    generateReport() {
        const reportType = document.getElementById('reportType');
        const reportStartDate = document.getElementById('reportStartDate');
        const reportEndDate = document.getElementById('reportEndDate');

        let filteredRequests = [];

        // Filter by request type
        const type = reportType ? reportType.value : 'single';
        let requestsByType;
        if (type === 'bulk') {
            requestsByType = this.bulkRequests || [];
        } else if (type === 'company') {
            requestsByType = this.companyRequests || [];
        } else {
            requestsByType = this.requests;
        }

        // Filter by date range
        const startDate = reportStartDate ? reportStartDate.value : null;
        const endDate = reportEndDate ? reportEndDate.value : null;

        if (startDate && endDate) {
            filteredRequests = requestsByType.filter(r => {
                const d = new Date(r.createdAt);
                const requestDate = d.toISOString().slice(0, 10);
                return requestDate >= startDate && requestDate <= endDate;
            });
        } else if (startDate) {
            filteredRequests = requestsByType.filter(r => {
                const d = new Date(r.createdAt);
                return d.toISOString().slice(0, 10) === startDate;
            });
        } else {
            // If no date selected, show all
            filteredRequests = requestsByType;
        }

        this.renderReportTable(filteredRequests, type);
    }

    /**
     * Render report table
     */
    renderReportTable(requests, type = 'single') {
        const container = document.getElementById('reportContainer');
        if (!container) return;

        if (requests.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-file-excel" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                    <p style="color: #94a3b8;">لا توجد طلبات للفترة المحددة</p>
                </div>
            `;
            return;
        }

        // For bulk requests, show all device details like single requests
        if (type === 'bulk') {
            const deviceRows = [];
            requests.forEach(bulkRequest => {
                if (bulkRequest.devices && bulkRequest.devices.length > 0) {
                    bulkRequest.devices.forEach(device => {
                        deviceRows.push({
                            requestNumber: bulkRequest.requestNumber,
                            customerName: bulkRequest.customerName,
                            customerPhone: bulkRequest.customerPhone,
                            laptopBrand: device.laptopBrand,
                            laptopModel: device.laptopModel,
                            serialNumber: device.serialNumber,
                            problemDescription: device.problemDescription,
                            status: device.status,
                            cost: bulkRequest.cost || 0,
                            technician: bulkRequest.technician || '—',
                            createdAt: bulkRequest.createdAt
                        });
                    });
                }
            });

            container.innerHTML = `
                <div class="glass-card">
                    <div style="overflow-x: auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>رقم الطلب</th>
                                    <th>اسم العميل</th>
                                    <th>الهاتف</th>
                                    <th>الجهاز</th>
                                    <th>المشكلة</th>
                                    <th>الحالة</th>
                                    <th>التكلفة</th>
                                    <th>الفني</th>
                                    <th>التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${deviceRows.map(r => `
                                    <tr>
                                        <td style="font-weight: 600;">${r.requestNumber}</td>
                                        <td>${r.customerName}</td>
                                        <td dir="ltr">${r.customerPhone}</td>
                                        <td>${r.laptopBrand} ${r.laptopModel || ''}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.problemDescription}</td>
                                        <td><span class="status-badge ${this.getStatusClass(r.status)}">${this.translateStatus(r.status)}</span></td>
                                        <td>${r.cost > 0 ? Utils.formatCurrency(r.cost) : '—'}</td>
                                        <td>${r.technician}</td>
                                        <td>${Utils.formatDate(r.createdAt)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <strong>إجمالي الطلبات:</strong> ${requests.length} | 
                        <strong>إجمالي الأجهزة:</strong> ${deviceRows.length}
                    </div>
                </div>
            `;
        } else if (type === 'company') {
            // Company requests - apply dashboard style
            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0;">طلبات موظفي الشركة (${requests.length})</h3>
                </div>
                <div class="table-container" style="overflow-x: auto;">
                    <table class="table" style="min-width: 1000px;">
                        <thead>
                            <tr>
                                <th>رقم الطلب</th>
                                <th>اسم الشركة</th>
                                <th>الهاتف</th>
                                <th>الجهاز</th>
                                <th>المشكلة</th>
                                <th>الحالة</th>
                                <th>التكلفة</th>
                                <th>الفني</th>
                                <th>التاريخ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${requests.map(r => `
                                <tr style="transition: background-color 0.2s;">
                                    <td style="font-weight: 600; color: #3b82f6;">${r.requestNumber}</td>
                                    <td style="font-weight: 600;">${r.companyName || r.full_name || r.fullName || '—'}</td>
                                    <td dir="ltr">${r.companyPhone || r.phone || '—'}</td>
                                    <td>${r.laptopBrand || r.laptop_brand || ''} ${r.laptopModel || r.laptop_model || ''}</td>
                                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.problemDescription || r.problem_description || '—'}</td>
                                    <td><span class="status-badge ${this.getStatusClass(r.status)}">${this.translateStatus(r.status)}</span></td>
                                    <td>${r.cost > 0 ? Utils.formatCurrency(r.cost) : '—'}</td>
                                    <td>${r.technician || '—'}</td>
                                    <td>${Utils.formatDate(r.createdAt)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                    <strong>إجمالي طلبات الشركات:</strong> ${requests.length}
                </div>
            `;
        } else {
            // Single requests (existing logic)
            container.innerHTML = `
                <div class="glass-card">
                    <div style="overflow-x: auto;">
                        <table class="table">
                            <thead>
                                <tr>
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
                            <tbody>
                                ${requests.map(r => `
                                    <tr>
                                        <td style="font-weight: 600;">${r.requestNumber}</td>
                                        <td>${r.fullName}</td>
                                        <td dir="ltr">${r.phone}</td>
                                        <td>${r.laptopBrand} ${r.laptopModel || ''}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.problemDescription}</td>
                                        <td><span class="status-badge ${this.getStatusClass(r.status)}">${this.translateStatus(r.status)}</span></td>
                                        <td>${r.cost > 0 ? Utils.formatCurrency(r.cost) : '—'}</td>
                                        <td>${Utils.formatDate(r.createdAt)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <strong>إجمالي الطلبات:</strong> ${requests.length} |
                        <strong>إجمالي التكلفة:</strong> ${Utils.formatCurrency(requests.reduce((sum, r) => sum + (r.cost || 0), 0))}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Render daily report table (legacy - for backward compatibility)
     */
    renderDailyReport() {
        this.generateReport();
    }

    /**
     * Export daily report as Excel
     */
    exportDailyReport() {
        const reportType = document.getElementById('reportType');
        const reportStartDate = document.getElementById('reportStartDate');
        const reportEndDate = document.getElementById('reportEndDate');

        let filteredRequests = [];

        // Filter by request type
        const type = reportType ? reportType.value : 'single';
        let requestsByType;
        if (type === 'bulk') {
            requestsByType = this.bulkRequests || [];
        } else if (type === 'company') {
            requestsByType = this.companyRequests || [];
        } else {
            requestsByType = this.requests;
        }

        console.log('📊 Report type:', type);
        console.log('📊 Total requests:', requestsByType.length);
        let fileName = 'تقرير';

        // Filter by date range
        const startDate = reportStartDate ? reportStartDate.value : null;
        const endDate = reportEndDate ? reportEndDate.value : null;

        if (startDate && endDate) {
            filteredRequests = requestsByType.filter(r => {
                const d = new Date(r.createdAt);
                const requestDate = d.toISOString().slice(0, 10);
                return requestDate >= startDate && requestDate <= endDate;
            });
            fileName = type === 'bulk' ? `تقرير-جملة-${startDate}-${endDate}` : type === 'company' ? `تقرير-شركات-${startDate}-${endDate}` : `تقرير-${startDate}-${endDate}`;
        } else if (startDate) {
            filteredRequests = requestsByType.filter(r => {
                const d = new Date(r.createdAt);
                return d.toISOString().slice(0, 10) === startDate;
            });
            fileName = type === 'bulk' ? `تقرير-جملة-${startDate}` : type === 'company' ? `تقرير-شركات-${startDate}` : `تقرير-${startDate}`;
        } else {
            // If no date selected, show all
            filteredRequests = requestsByType;
            fileName = type === 'bulk' ? 'تقرير-طلبات-جملة' : type === 'company' ? 'تقرير-طلبات-شركات' : 'تقرير-كل-الطلبات';
        }

        console.log('📊 Filtered requests:', filteredRequests.length);

        if (filteredRequests.length === 0) {
            toast.error('لا توجد طلبات في الفترة المحددة');
            return;
        }

        let data;
        if (type === 'bulk') {
            // For bulk requests, show each request as a row with summary info
            data = [
                ['#', 'رقم الطلب', 'اسم العميل', 'الهاتف', 'عدد اللابتوبات', 'الحالة', 'التكلفة', 'الفني', 'رد الإدارة', 'تاريخ الاستلام المتوقع', 'تاريخ الطلب'],
                ...filteredRequests.map((r, i) => [
                    i + 1,
                    r.requestNumber,
                    r.customerName,
                    r.customerPhone,
                    r.deviceCount,
                    this.translateStatus(r.status),
                    r.cost > 0 ? r.cost : 0,
                    r.technician || '—',
                    r.adminReply || '—',
                    r.estimatedCompletionDate ? Utils.formatDate(r.estimatedCompletionDate) : '—',
                    Utils.formatDate(r.createdAt)
                ])
            ];
        } else if (type === 'company') {
            // Company requests
            data = [
                ['#', 'رقم الطلب', 'الاسم', 'الهاتف', 'الجهاز', 'الرقم التسلسلي', 'المشكلة', 'رد الإدارة', 'الحالة', 'التكلفة', 'الفني', 'تاريخ الاستلام', 'تاريخ التسليم المتوقع', 'تاريخ الطلب'],
                ...filteredRequests.map((r, i) => [
                    i + 1,
                    r.requestNumber || r.request_number,
                    r.fullName || r.full_name,
                    r.phone,
                    `${r.laptopBrand || r.laptop_brand}${r.laptopModel || r.laptop_model ? ' ' + (r.laptopModel || r.laptop_model) : ''}`,
                    r.serialNumber || r.serial_number || '—',
                    r.problemDescription || r.problem_description,
                    r.adminReply || r.admin_reply || '—',
                    this.translateStatus(r.status),
                    r.cost > 0 ? r.cost : 0,
                    r.technician || '—',
                    r.receivedDate || r.received_date ? Utils.formatDate(r.receivedDate || r.received_date) : '—',
                    r.estimatedCompletionDate || r.estimated_completion_date ? Utils.formatDate(r.estimatedCompletionDate || r.estimated_completion_date) : '—',
                    Utils.formatDate(r.createdAt || r.created_at)
                ])
            ];
        } else {
            // Single requests
            data = [
                ['#', 'رقم الطلب', 'اسم العميل', 'الهاتف', 'الجهاز', 'الرقم التسلسلي', 'المشكلة', 'رد الإدارة', 'الحالة', 'التكلفة', 'الفني', 'تاريخ الاستلام', 'تاريخ التسليم المتوقع', 'تاريخ الطلب'],
                ...filteredRequests.map((r, i) => [
                    i + 1,
                    r.requestNumber,
                    r.fullName,
                    r.phone,
                    `${r.laptopBrand}${r.laptopModel ? ' ' + r.laptopModel : ''}`,
                    r.serialNumber || '—',
                    r.problemDescription,
                    r.adminReply || '—',
                    this.translateStatus(r.status),
                    r.cost > 0 ? r.cost : 0,
                    r.technician || '—',
                    r.receivedDate ? Utils.formatDate(r.receivedDate) : '—',
                    r.estimatedCompletionDate ? Utils.formatDate(r.estimatedCompletionDate) : '—',
                    Utils.formatDate(r.createdAt)
                ])
            ];
        }

        const ws = XLSX.utils.aoa_to_sheet(data);
        // Column widths - same for all types now
        ws['!cols'] = [
            {wch:4},{wch:14},{wch:20},{wch:14},{wch:15},{wch:18},{wch:10},{wch:15},{wch:25},{wch:18},{wch:20}
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'التقرير');
        XLSX.writeFile(wb, `YAS-${fileName}.xlsx`);
        toast.success(`تم تصدير ${filteredRequests.length} طلب بنجاح ✅`);
    }

}

// Create global instance
const adminManager = new AdminManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('adminDashboard')) {
        await adminManager.init();
    }
});
