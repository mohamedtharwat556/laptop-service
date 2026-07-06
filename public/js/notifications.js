/**
 * YAS Laptop Service Center - Notifications Manager
 * Simulates email notification system
 */

class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.emailQueue = [];
        this.init();
    }

    init() {
        this.loadNotifications();
        this.startEmailProcessor();
    }

    loadNotifications() {
        this.notifications = storage.get('notifications') || [];
    }

    saveNotifications() {
        storage.set('notifications', this.notifications);
    }

    /**
     * Send notification (simulated email)
     */
    sendNotification(notificationData) {
        const notification = {
            id: storage.generateId(),
            ...notificationData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            sentAt: null,
            attempts: 0
        };

        this.notifications.push(notification);
        this.emailQueue.push(notification);
        this.saveNotifications();

        // Show toast notification
        this.showNotificationToast(notification);

        return notification;
    }

    /**
     * Process email queue (simulated)
     */
    startEmailProcessor() {
        setInterval(() => {
            this.processQueue();
        }, 5000); // Process every 5 seconds
    }

    processQueue() {
        if (this.emailQueue.length === 0) return;

        const notification = this.emailQueue.shift();
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
        notification.attempts++;

        this.saveNotifications();
        console.log(`[Email Sent] To: ${notification.to}, Subject: ${notification.subject}`);
    }

    /**
     * Show toast notification
     */
    showNotificationToast(notification) {
        const toastContent = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="fas fa-envelope" style="font-size: 1.5rem; color: #3b82f6;"></i>
                <div>
                    <p style="font-weight: 600; margin-bottom: 0.25rem;">${notification.subject}</p>
                    <p style="font-size: 0.875rem; color: var(--text-muted-more);">${notification.message.substring(0, 50)}...</p>
                </div>
            </div>
        `;

        toast.show(notification.subject, 'info', 5000);
    }

    /**
     * Request status update notification
     */
    notifyRequestStatusUpdate(request) {
        return this.sendNotification({
            to: request.phone,
            email: `${request.phone}@yas.com`, // Simulated email
            subject: `Request ${request.requestNumber} Status Update`,
            message: `Your laptop repair request ${request.requestNumber} status has been updated to: ${request.status}. ${request.technicianNotes ? 'Technician notes: ' + request.technicianNotes : ''}`,
            type: 'request_status',
            requestId: request.id
        });
    }

    /**
     * Order confirmation notification
     */
    notifyOrderConfirmation(order) {
        return this.sendNotification({
            to: order.customerPhone,
            email: `${order.customerPhone}@yas.com`,
            subject: `Order ${order.orderNumber} Confirmed`,
            message: `Your order ${order.orderNumber} has been confirmed. Total amount: ${Utils.formatCurrency(order.total)}. We will contact you at ${order.customerPhone} for delivery confirmation.`,
            type: 'order_confirmation',
            orderId: order.id
        });
    }

    /**
     * Order shipped notification
     */
    notifyOrderShipped(order) {
        return this.sendNotification({
            to: order.customerPhone,
            email: `${order.customerPhone}@yas.com`,
            subject: `Order ${order.orderNumber} Shipped`,
            message: `Your order ${order.orderNumber} has been shipped and is on its way to your address.`,
            type: 'order_shipped',
            orderId: order.id
        });
    }

    /**
     * Request completed notification
     */
    notifyRequestCompleted(request) {
        return this.sendNotification({
            to: request.phone,
            email: `${request.phone}@yas.com`,
            subject: `Request ${request.requestNumber} Completed`,
            message: `Your laptop repair request ${request.requestNumber} has been completed. Your device is ready for pickup. Total cost: ${Utils.formatCurrency(request.cost || 0)}.`,
            type: 'request_completed',
            requestId: request.id
        });
    }

    /**
     * Welcome notification for new users
     */
    notifyWelcome(user) {
        return this.sendNotification({
            to: user.email || user.username,
            email: user.email,
            subject: 'Welcome to YAS Laptop Service Center',
            message: `Welcome ${user.name}! Thank you for joining YAS Laptop Service Center. We're here to help with all your laptop repair needs.`,
            type: 'welcome',
            userId: user.id
        });
    }

    /**
     * Promotional notification
     */
    notifyPromotion(promotionData) {
        return this.sendNotification({
            to: 'all',
            email: 'all@yas.com',
            subject: promotionData.subject,
            message: promotionData.message,
            type: 'promotion'
        });
    }

    /**
     * Get user notifications
     */
    getUserNotifications(userId) {
        return this.notifications.filter(n => n.userId === userId);
    }

    /**
     * Get request notifications
     */
    getRequestNotifications(requestId) {
        return this.notifications.filter(n => n.requestId === requestId);
    }

    /**
     * Get order notifications
     */
    getOrderNotifications(orderId) {
        return this.notifications.filter(n => n.orderId === orderId);
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            this.saveNotifications();
        }
    }

    /**
     * Get notification statistics
     */
    getStatistics() {
        const total = this.notifications.length;
        const sent = this.notifications.filter(n => n.status === 'sent').length;
        const pending = this.notifications.filter(n => n.status === 'pending').length;
        const read = this.notifications.filter(n => n.read).length;

        return {
            total,
            sent,
            pending,
            read,
            unread: total - read
        };
    }

    /**
     * Render notification center
     */
    renderNotificationCenter() {
        const stats = this.getStatistics();
        
        return `
            <div class="notification-center">
                <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Notification Statistics</h3>
                    <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
                        <div class="stat-item" style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #3b82f6;">${stats.total}</div>
                            <div style="color: var(--text-muted-more); font-size: 0.875rem;">Total</div>
                        </div>
                        <div class="stat-item" style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #10b981;">${stats.sent}</div>
                            <div style="color: var(--text-muted-more); font-size: 0.875rem;">Sent</div>
                        </div>
                        <div class="stat-item" style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${stats.pending}</div>
                            <div style="color: var(--text-muted-more); font-size: 0.875rem;">Pending</div>
                        </div>
                        <div class="stat-item" style="text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: #64748b;">${stats.unread}</div>
                            <div style="color: var(--text-muted-more); font-size: 0.875rem;">Unread</div>
                        </div>
                    </div>
                </div>
                
                <div class="glass-card" style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Recent Notifications</h3>
                    <div class="notifications-list" style="max-height: 400px; overflow-y: auto;">
                        ${this.notifications.slice(-10).reverse().map(notification => `
                            <div class="notification-item" style="padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); ${!notification.read ? 'background: rgba(59, 130, 246, 0.1);' : ''}">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div style="flex: 1;">
                                        <h4 style="font-weight: 600; margin-bottom: 0.25rem;">${notification.subject}</h4>
                                        <p style="color: var(--text-muted-more); font-size: 0.875rem; margin-bottom: 0.5rem;">${notification.message.substring(0, 100)}...</p>
                                        <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: #64748b;">
                                            <span><i class="fas fa-user"></i> ${notification.to}</span>
                                            <span><i class="fas fa-clock"></i> ${Utils.formatDate(notification.createdAt)}</span>
                                            <span><i class="fas fa-check-circle" style="color: ${notification.status === 'sent' ? '#10b981' : '#f59e0b'}"></i> ${notification.status}</span>
                                        </div>
                                    </div>
                                    ${!notification.read ? `
                                        <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                                onclick="notificationsManager.markAsRead('${notification.id}')">
                                            Mark as Read
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                        ${this.notifications.length === 0 ? `
                            <div class="empty-state">
                                <i class="fas fa-envelope"></i>
                                <h3>No Notifications</h3>
                                <p>No notifications have been sent yet.</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Send custom notification
     */
    sendCustomNotification(to, subject, message) {
        return this.sendNotification({
            to: to,
            email: `${to}@yas.com`,
            subject: subject,
            message: message,
            type: 'custom'
        });
    }
}

// Create global instance
const notificationsManager = new NotificationsManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    notificationsManager.init();
});
