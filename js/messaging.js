/**
 * YAS Laptop Service Center - Messaging Manager
 * Handles messaging system between staff and customers
 * v2.0 — responsive, searchable, typing indicator, polling, CSS-variable-safe
 */

class MessagingManager {
    constructor() {
        this.activeConversation = null;
        this.currentPhone = null;
        this.currentUserRole = null;
        this.pollingInterval = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.searchQuery = '';
        this.PAGE_SIZE = 10;
        this.adminPage = 1;
        this.init();
    }

    /* ─────────────────────────── Storage ─────────────────────────── */

    init() { this.loadMessages(); }

    loadMessages() {
        this.messages = storage.get('messages') || [];
    }

    saveMessages() {
        storage.set('messages', this.messages);
    }

    /* ─────────────────────────── Data helpers ─────────────────────── */

    getConversations(phone) {
        const conversations = this.messages.filter(m => m.phone === phone);
        const grouped = {};

        conversations.forEach(msg => {
            const key = msg.conversationId || 'general';
            if (!grouped[key]) {
                grouped[key] = {
                    conversationId: key,
                    type: msg.conversationType || 'general',
                    messages: [],
                    lastMessage: null,
                    unreadCount: 0
                };
            }
            grouped[key].messages.push(msg);
            if (!grouped[key].lastMessage ||
                new Date(msg.createdAt) > new Date(grouped[key].lastMessage.createdAt)) {
                grouped[key].lastMessage = msg;
            }
            if (!msg.read && msg.senderRole !== 'customer') {
                grouped[key].unreadCount++;
            }
        });

        return Object.values(grouped).sort((a, b) =>
            new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)
        );
    }

    getMessagesByConversation(conversationId) {
        return this.messages
            .filter(m => m.conversationId === conversationId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    sendMessage(messageData) {
        const newMessage = {
            id: storage.generateId(),
            ...messageData,
            read: false,
            createdAt: new Date().toISOString()
        };
        this.messages.push(newMessage);
        this.saveMessages();
        return newMessage;
    }

    markAsRead(conversationId, senderRole) {
        this.messages.forEach(msg => {
            if (msg.conversationId === conversationId && msg.senderRole !== senderRole) {
                msg.read = true;
                msg.readAt = new Date().toISOString();
            }
        });
        this.saveMessages();
    }

    getUnreadCount(userRole, userId) {
        return this.messages.filter(m =>
            !m.read &&
            m.senderRole !== userRole &&
            (m.recipientId === userId || m.recipientRole === userRole)
        ).length;
    }

    /* ─────────────────────────── Label helpers ────────────────────── */

    _typeLabel(type) {
        const map = { request: 'دعم الطلبات', order: 'دعم الطلبيات', general: 'دعم عام' };
        return map[type] || 'دعم عام';
    }

    _typeIcon(type) {
        const map = { request: 'fa-tools', order: 'fa-box', general: 'fa-headset' };
        return map[type] || 'fa-headset';
    }

    /* ─────────────────────────── Customer Interface ───────────────── */

    renderMessagingInterface(phone, userRole = 'customer') {
        const conversations = this.getConversations(phone);

        // Start polling for new messages
        this._startPolling(phone, userRole);

        const hasSidebar = conversations.length > 0;

        if (!hasSidebar) {
            return `
                <div class="msg-empty-full">
                    <div class="msg-empty-icon"><i class="fas fa-comments"></i></div>
                    <h3>لا توجد محادثات بعد</h3>
                    <p>ابدأ محادثة مع فريق الدعم الآن</p>
                    <button class="btn btn-primary msg-start-btn"
                            onclick="messagingManager.showNewMessageModal('${phone}', '${userRole}')">
                        <i class="fas fa-plus"></i> بدء محادثة
                    </button>
                </div>
            `;
        }

        return `
            <div class="messaging-interface">
                <!-- Sidebar -->
                <div class="msg-sidebar glass-card">
                    <div class="msg-sidebar-header">
                        <h3 class="msg-sidebar-title">
                            <i class="fas fa-comments"></i> المحادثات
                        </h3>
                        <button class="btn btn-secondary msg-new-btn"
                                onclick="messagingManager.showNewMessageModal('${phone}', '${userRole}')"
                                title="محادثة جديدة">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>

                    <!-- Search -->
                    <div class="msg-search-wrap">
                        <i class="fas fa-search msg-search-icon"></i>
                        <input type="text" class="msg-search-input" id="convSearchInput"
                               placeholder="بحث في المحادثات..."
                               oninput="messagingManager._filterConversations(this.value, '${phone}', '${userRole}')">
                    </div>

                    <div class="msg-conv-list" id="convList">
                        ${conversations.map(c => this._renderConvItem(c, phone, userRole)).join('')}
                    </div>
                </div>

                <!-- Message View -->
                <div class="msg-view glass-card">
                    <div class="msg-view-header" id="messageHeader">
                        <div class="msg-placeholder-header">
                            <i class="fas fa-arrow-right msg-placeholder-icon"></i>
                            <p>اختر محادثة لعرض الرسائل</p>
                        </div>
                    </div>

                    <div class="msg-list" id="messageList">
                        <div class="msg-empty-chat">
                            <i class="fas fa-comment-dots"></i>
                            <p>ابدأ محادثة أو اختر واحدة من القائمة</p>
                        </div>
                    </div>

                    <!-- Typing indicator -->
                    <div class="msg-typing" id="typingIndicator" style="display:none;">
                        <span class="msg-typing-dot"></span>
                        <span class="msg-typing-dot"></span>
                        <span class="msg-typing-dot"></span>
                    </div>

                    <div class="msg-input-wrap" id="messageInput" style="display:none;">
                        <form id="sendMessageForm" class="msg-input-form">
                            <input type="text" class="form-input msg-text-input"
                                   name="message"
                                   placeholder="اكتب رسالتك..."
                                   oninput="messagingManager._handleTyping()">
                            <button type="submit" class="btn btn-primary msg-send-btn" title="إرسال">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    /* ─────────────────────────── Conversation item ────────────────── */

    _renderConvItem(conversation, phone, userRole) {
        const last = conversation.lastMessage;
        const isActive = this.activeConversation === conversation.conversationId;
        const preview = last?.message?.substring(0, 45) || 'لا توجد رسائل';
        const time = last ? Utils.formatDate(last.createdAt) : '';

        return `
            <div class="msg-conv-item ${isActive ? 'active' : ''}"
                 onclick="messagingManager.loadConversation('${conversation.conversationId}', '${phone}', '${userRole}')">
                <div class="msg-conv-avatar">
                    <i class="fas ${this._typeIcon(conversation.type)}"></i>
                </div>
                <div class="msg-conv-info">
                    <div class="msg-conv-top">
                        <span class="msg-conv-name">${this._typeLabel(conversation.type)}</span>
                        <span class="msg-conv-time">${time}</span>
                    </div>
                    <div class="msg-conv-preview">
                        <span class="msg-conv-text">${preview}${last ? '…' : ''}</span>
                        ${conversation.unreadCount > 0 ? `
                            <span class="msg-badge">${conversation.unreadCount}</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /* ─────────────────────────── Search / Filter ──────────────────── */

    _filterConversations(query, phone, userRole) {
        this.searchQuery = query.toLowerCase();
        const conversations = this.getConversations(phone).filter(c => {
            if (!this.searchQuery) return true;
            const label = this._typeLabel(c.type).toLowerCase();
            const preview = c.lastMessage?.message?.toLowerCase() || '';
            return label.includes(this.searchQuery) || preview.includes(this.searchQuery);
        });

        const list = document.getElementById('convList');
        if (!list) return;

        if (conversations.length === 0) {
            list.innerHTML = `
                <div class="msg-empty-search">
                    <i class="fas fa-search"></i>
                    <p>لا نتائج لـ "${query}"</p>
                </div>
            `;
            return;
        }

        list.innerHTML = conversations.map(c => this._renderConvItem(c, phone, userRole)).join('');
    }

    /* ─────────────────────────── Load conversation ────────────────── */

    loadConversation(conversationId, phone, userRole) {
        this.activeConversation = conversationId;
        this.currentPhone = phone;
        this.currentUserRole = userRole;

        const messages = this.getMessagesByConversation(conversationId);
        const conversation = this.getConversations(phone).find(c => c.conversationId === conversationId);

        this.markAsRead(conversationId, userRole);

        // Header
        const header = document.getElementById('messageHeader');
        if (header) {
            header.innerHTML = `
                <div class="msg-header-info">
                    <div class="msg-header-avatar">
                        <i class="fas ${this._typeIcon(conversation?.type)}"></i>
                    </div>
                    <div>
                        <h3>${this._typeLabel(conversation?.type)}</h3>
                        <p class="msg-header-meta">${messages.length} رسالة</p>
                    </div>
                </div>
            `;
        }

        // Messages
        const messageList = document.getElementById('messageList');
        if (messageList) {
            messageList.innerHTML = messages.length === 0
                ? `<div class="msg-empty-chat"><i class="fas fa-comment-dots"></i><p>لا توجد رسائل بعد. ابدأ المحادثة!</p></div>`
                : messages.map(msg => this._renderBubble(msg, userRole)).join('');
            requestAnimationFrame(() => { messageList.scrollTop = messageList.scrollHeight; });
        }

        // Show input
        const input = document.getElementById('messageInput');
        if (input) input.style.display = 'block';

        // Form submit
        const form = document.getElementById('sendMessageForm');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this._sendQuickMessage(conversationId, phone, userRole);
            };
        }

        // Refresh sidebar highlight
        this._refreshSidebar(phone, userRole);
    }

    _refreshSidebar(phone, userRole) {
        const list = document.getElementById('convList');
        if (!list) return;
        const conversations = this.getConversations(phone).filter(c => {
            if (!this.searchQuery) return true;
            return this._typeLabel(c.type).toLowerCase().includes(this.searchQuery) ||
                   (c.lastMessage?.message?.toLowerCase() || '').includes(this.searchQuery);
        });
        list.innerHTML = conversations.map(c => this._renderConvItem(c, phone, userRole)).join('');
    }

    /* ─────────────────────────── Message bubble ───────────────────── */

    _renderBubble(message, currentUserRole) {
        const isOwn = message.senderRole === currentUserRole;
        const readMark = isOwn
            ? `<span class="msg-read-mark ${message.read ? 'read' : ''}">
                   <i class="fas fa-check${message.read ? '-double' : ''}"></i>
               </span>`
            : '';

        return `
            <div class="msg-bubble-row ${isOwn ? 'own' : 'other'}">
                ${!isOwn ? `<div class="msg-avatar-sm"><i class="fas fa-headset"></i></div>` : ''}
                <div class="msg-bubble ${isOwn ? 'own' : 'other'}">
                    <p class="msg-text">${this._escapeHtml(message.message)}</p>
                    <div class="msg-meta">
                        <span class="msg-time">${Utils.formatDate(message.createdAt)}</span>
                        ${readMark}
                    </div>
                </div>
            </div>
        `;
    }

    _escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /* ─────────────────────────── Send message ─────────────────────── */

    _sendQuickMessage(conversationId, phone, userRole) {
        const form = document.getElementById('sendMessageForm');
        const messageText = form.message.value.trim();
        if (!messageText) return;

        this.sendMessage({
            phone,
            conversationId,
            conversationType: 'general',
            senderRole: userRole,
            recipientRole: userRole === 'customer' ? 'employee' : 'customer',
            message: messageText
        });

        form.message.value = '';
        this._hideTyping();
        this.loadConversation(conversationId, phone, userRole);
    }

    /* ─────────────────────────── Typing indicator ─────────────────── */

    _handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            this._showTyping();
        }
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this._hideTyping();
        }, 1500);
    }

    _showTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.style.display = 'flex';
    }

    _hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.style.display = 'none';
        this.isTyping = false;
    }

    /* ─────────────────────────── Polling ──────────────────────────── */

    _startPolling(phone, userRole) {
        this._stopPolling();
        this.pollingInterval = setInterval(() => {
            this.loadMessages(); // re-read from storage

            // Silently update unread badge if sidebar exists
            if (document.getElementById('convList')) {
                this._refreshSidebar(phone, userRole);
            }

            // Silently update open conversation messages
            if (this.activeConversation && document.getElementById('messageList')) {
                const messages = this.getMessagesByConversation(this.activeConversation);
                const list = document.getElementById('messageList');
                const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 20;

                list.innerHTML = messages.length === 0
                    ? `<div class="msg-empty-chat"><i class="fas fa-comment-dots"></i><p>لا توجد رسائل بعد.</p></div>`
                    : messages.map(msg => this._renderBubble(msg, userRole)).join('');

                if (atBottom) list.scrollTop = list.scrollHeight;
            }
        }, 5000); // every 5 seconds
    }

    _stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /* ─────────────────────────── New message modal ────────────────── */

    showNewMessageModal(phone, userRole) {
        const content = `
            <form id="newConversationForm">
                <div class="form-group">
                    <label class="form-label">نوع المحادثة</label>
                    <select class="form-select" name="conversationType" required>
                        <option value="general">دعم عام</option>
                        <option value="request">دعم الطلبات</option>
                        <option value="order">دعم الطلبيات</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">الرقم المرجعي (اختياري)</label>
                    <input type="text" class="form-input" name="referenceId"
                           placeholder="رقم الطلب أو الطلبية">
                </div>
                <div class="form-group">
                    <label class="form-label">رسالتك *</label>
                    <textarea class="form-textarea" name="message" rows="4" required
                              placeholder="كيف يمكننا مساعدتك؟"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">
                    <i class="fas fa-paper-plane"></i> إرسال
                </button>
            </form>
        `;

        modalManager.create('new-message', 'محادثة جديدة', content);
        modalManager.open('new-message');

        const form = document.getElementById('newConversationForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const conversationId = form.referenceId.value.trim() || storage.generateId();

            this.sendMessage({
                phone,
                conversationId,
                conversationType: form.conversationType.value,
                senderRole: userRole,
                recipientRole: userRole === 'customer' ? 'employee' : 'customer',
                message: form.message.value
            });

            modalManager.close('new-message');
            toast.success('تم إرسال الرسالة بنجاح!');

            // Re-render full interface
            const container = document.querySelector('.messaging-interface') ||
                              document.querySelector('.msg-empty-full')?.parentElement;
            if (container) {
                container.outerHTML = this.renderMessagingInterface(phone, userRole);
            }
        });
    }

    /* ─────────────────────────── Statistics ───────────────────────── */

    getStatistics() {
        const stats = {
            totalMessages: this.messages.length,
            totalConversations: new Set(this.messages.map(m => m.conversationId)).size,
            unreadCount: this.messages.filter(m => !m.read).length,
            byRole: {},
            byType: {}
        };
        this.messages.forEach(msg => {
            stats.byRole[msg.senderRole] = (stats.byRole[msg.senderRole] || 0) + 1;
            stats.byType[msg.conversationType] = (stats.byType[msg.conversationType] || 0) + 1;
        });
        return stats;
    }

    /* ─────────────────────────── Admin dashboard ──────────────────── */

    renderAdminDashboard() {
        const stats = this.getStatistics();
        return `
            <div class="messaging-dashboard">
                <div class="dashboard-header">
                    <h2>مركز الرسائل</h2>
                </div>

                <div class="stats-grid" style="margin-bottom:2rem;">
                    <div class="glass-card stat-card">
                        <div class="stat-icon"><i class="fas fa-comments"></i></div>
                        <div class="stat-info">
                            <h3>${stats.totalMessages}</h3>
                            <p>إجمالي الرسائل</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon warning"><i class="fas fa-envelope"></i></div>
                        <div class="stat-info">
                            <h3>${stats.unreadCount}</h3>
                            <p>غير مقروءة</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon success"><i class="fas fa-users"></i></div>
                        <div class="stat-info">
                            <h3>${stats.totalConversations}</h3>
                            <p>محادثات</p>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding:1.5rem;">
                    <div class="msg-admin-top">
                        <h3>المحادثات الأخيرة</h3>
                        <div class="msg-search-wrap" style="max-width:260px;">
                            <i class="fas fa-search msg-search-icon"></i>
                            <input type="text" class="msg-search-input" id="adminSearchInput"
                                   placeholder="بحث..."
                                   oninput="messagingManager._adminSearch(this.value)">
                        </div>
                    </div>
                    <div id="adminConversationsList">
                        ${this.renderAdminConversationsList()}
                    </div>
                </div>
            </div>
        `;
    }

    _adminSearch(query) {
        this.adminSearchQuery = query.toLowerCase();
        this.adminPage = 1;
        const el = document.getElementById('adminConversationsList');
        if (el) el.innerHTML = this.renderAdminConversationsList();
    }

    _adminLoadMore() {
        this.adminPage++;
        const el = document.getElementById('adminConversationsList');
        if (el) el.innerHTML = this.renderAdminConversationsList();
    }

    renderAdminConversationsList() {
        const allConversations = new Map();

        this.messages.forEach(msg => {
            const key = msg.conversationId;
            if (!allConversations.has(key)) {
                allConversations.set(key, {
                    conversationId: key,
                    phone: msg.phone,
                    type: msg.conversationType,
                    messages: [],
                    lastMessage: null,
                    unreadCount: 0
                });
            }
            const conv = allConversations.get(key);
            conv.messages.push(msg);
            if (!conv.lastMessage || new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
                conv.lastMessage = msg;
            }
            if (!msg.read && msg.senderRole === 'customer') {
                conv.unreadCount++;
            }
        });

        let conversations = Array.from(allConversations.values())
            .sort((a, b) => new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt));

        // Apply search filter
        const q = this.adminSearchQuery || '';
        if (q) {
            conversations = conversations.filter(c =>
                c.phone?.includes(q) ||
                this._typeLabel(c.type).toLowerCase().includes(q) ||
                (c.lastMessage?.message?.toLowerCase() || '').includes(q)
            );
        }

        if (conversations.length === 0) {
            return `
                <div class="msg-empty-full" style="padding:2rem;">
                    <div class="msg-empty-icon"><i class="fas fa-comments"></i></div>
                    <h3>${q ? 'لا نتائج للبحث' : 'لا توجد محادثات'}</h3>
                    <p>${q ? `لا يوجد ما يطابق "${q}"` : 'لم يبدأ أي عميل محادثة بعد.'}</p>
                </div>
            `;
        }

        const total = conversations.length;
        const paged = conversations.slice(0, this.adminPage * this.PAGE_SIZE);
        const hasMore = paged.length < total;

        return `
            <div class="msg-admin-list">
                ${paged.map(conv => `
                    <div class="msg-admin-item glass-card"
                         onclick="messagingManager.loadConversation('${conv.conversationId}', '${conv.phone}', 'employee')">
                        <div class="msg-admin-avatar">
                            <i class="fas ${this._typeIcon(conv.type)}"></i>
                        </div>
                        <div class="msg-admin-info">
                            <div class="msg-admin-row">
                                <span class="msg-admin-phone">${conv.phone}</span>
                                <span class="msg-conv-time">${conv.lastMessage ? Utils.formatDate(conv.lastMessage.createdAt) : ''}</span>
                            </div>
                            <div class="msg-admin-row">
                                <span class="status-badge status-received msg-type-badge">${this._typeLabel(conv.type)}</span>
                                ${conv.unreadCount > 0 ? `<span class="msg-badge">${conv.unreadCount} جديد</span>` : ''}
                            </div>
                            <p class="msg-admin-preview">${conv.lastMessage?.message?.substring(0, 80) || 'لا توجد رسائل'}…</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${hasMore ? `
                <div style="text-align:center;margin-top:1rem;">
                    <button class="btn btn-secondary" onclick="messagingManager._adminLoadMore()">
                        <i class="fas fa-chevron-down"></i> تحميل المزيد (${total - paged.length} متبقي)
                    </button>
                </div>
            ` : ''}
        `;
    }
}

/* ─────────────────────────── Global instance ──────────────────────── */
const messagingManager = new MessagingManager();

document.addEventListener('DOMContentLoaded', () => {
    messagingManager.init();
});
