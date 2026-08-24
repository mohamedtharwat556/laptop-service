/**
 * YAS Laptop Service Center - Customer Module
 * Handles maintenance requests and tracking for customers
 */

class CustomerManager {
    constructor() {
        this.currentRequest = null;
        // Use same-origin API (Vercel handles both frontend and backend)
        this.apiBase = '/api';
    }

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Submit a maintenance request
     */
    async submitRequest(formData) {
        console.log('📝 Submitting request with data:', formData);
        console.log('🌐 API Base:', this.apiBase);

        // Handle image upload - convert to base64
        let deviceImage = '';
        if (formData.deviceImage && formData.deviceImage instanceof File) {
            deviceImage = await this.fileToBase64(formData.deviceImage);
        }

        const requestData = {
            requestNumber: formData.requestNumber,
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email || '',
            laptopBrand: formData.laptopBrand,
            laptopModel: formData.laptopModel,
            serialNumber: formData.serialNumber,
            receivedDate: formData.receivedDate,
            problemDescription: formData.problemDescription,
            priority: formData.priority || 'Medium',
            deviceImage: deviceImage
        };

        console.log('📤 Request data to send:', requestData);

        // Use same-origin API (Vercel handles both frontend and backend)
        const apiUrl = '/api/requests';
        console.log('📡 Calling API directly:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);

        const responseData = await response.json();
        console.log('📥 Response data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to submit request');
        }

        this.currentRequest = responseData;
        return responseData;
    }

    /**
     * Track a request by name, phone number or request number
     */
    async trackRequest(searchTerm, searchType = 'phone') {
        try {
            // Use same-origin API (Vercel handles both frontend and backend)
            const apiUrl = '/api/requests';
            const response = await fetch(apiUrl);
            const requests = await response.json();

            let request;
            if (searchType === 'phone') {
                request = requests.filter(r => r.phone === searchTerm);
                request = request.length > 0 ? request[request.length - 1] : null;
            } else if (searchType === 'name') {
                request = requests.filter(r => (r.fullName || r.full_name || '').toLowerCase() === searchTerm.toLowerCase());
                request = request.length > 0 ? request[request.length - 1] : null;
            } else {
                request = requests.find(r => (r.requestNumber || r.request_number) === searchTerm);
            }

            // Convert snake_case to camelCase
            if (request) {
                request = this.convertToCamelCase(request);
            }

            // Store current search for refresh
            this.currentSearchTerm = searchTerm;
            this.currentSearchType = searchType;

            return request;
        } catch (error) {
            console.error('Failed to track request:', error);
            return null;
        }
    }

    /**
     * Track a bulk request by name, phone number or request number
     */
    async trackBulkRequest(searchTerm, searchType = 'phone') {
        try {
            const apiUrl = '/api/bulk-requests';
            const response = await fetch(apiUrl);
            const bulkRequests = await response.json();

            console.log('🔍 Bulk requests from API:', bulkRequests);
            console.log('🔍 Search term:', searchTerm);
            console.log('🔍 Search type:', searchType);

            let bulkRequest;
            if (searchType === 'phone') {
                bulkRequest = bulkRequests.filter(r => r.customerPhone === searchTerm);
                bulkRequest = bulkRequest.length > 0 ? bulkRequest[bulkRequest.length - 1] : null;
            } else if (searchType === 'name') {
                bulkRequest = bulkRequests.filter(r => r.customerName.toLowerCase() === searchTerm.toLowerCase());
                bulkRequest = bulkRequest.length > 0 ? bulkRequest[bulkRequest.length - 1] : null;
            } else {
                bulkRequest = bulkRequests.find(r => r.requestNumber === searchTerm);
            }

            console.log('🔍 Found bulk request:', bulkRequest);

            // Store current search for refresh
            this.currentSearchTerm = searchTerm;
            this.currentSearchType = searchType;

            return bulkRequest;
        } catch (error) {
            console.error('Failed to track bulk request:', error);
            return null;
        }
    }

    /**
     * Track a company request by name, phone number or request number
     */
    async trackCompanyRequest(searchTerm, searchType = 'phone') {
        try {
            const apiUrl = '/api/company-requests';
            const response = await fetch(apiUrl);
            const companyRequests = await response.json();

            console.log('🔍 Company requests from API:', companyRequests);
            console.log('🔍 Search term:', searchTerm);
            console.log('🔍 Search type:', searchType);

            let companyRequest;
            if (searchType === 'phone') {
                companyRequest = companyRequests.filter(r => (r.phone || r.companyPhone || r.company_phone) === searchTerm);
                companyRequest = companyRequest.length > 0 ? companyRequest[companyRequest.length - 1] : null;
            } else if (searchType === 'name') {
                companyRequest = companyRequests.filter(r => (r.fullName || r.full_name || r.companyName || r.company_name || '').toLowerCase() === searchTerm.toLowerCase());
                companyRequest = companyRequest.length > 0 ? companyRequest[companyRequest.length - 1] : null;
            } else {
                companyRequest = companyRequests.find(r => (r.requestNumber || r.request_number) === searchTerm);
            }

            console.log('🔍 Found company request:', companyRequest);

            // Store current search for refresh
            this.currentSearchTerm = searchTerm;
            this.currentSearchType = searchType;

            return companyRequest;
        } catch (error) {
            console.error('Failed to track company request:', error);
            return null;
        }
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
     * Get request timeline
     */
    getRequestTimeline(request) {
        const timeline = [
            {
                status: 'Received',
                date: request.createdAt,
                completed: true
            }
        ];

        const statusFlow = [
            'Waiting Inspection',
            'Under Maintenance',
            'Waiting Parts',
            'Ready',
            'Delivered'
        ];

        const currentIndex = statusFlow.indexOf(request.status);

        statusFlow.forEach((status, index) => {
            if (index <= currentIndex) {
                timeline.push({
                    status: status,
                    date: index === currentIndex ? request.updatedAt : null,
                    completed: index < currentIndex
                });
            }
        });

        return timeline;
    }

    translateStatus(status) {
        const statusMap = {
            'Received': 'تم الاستلام',
            'Waiting Inspection': 'بانتظار الفحص',
            'Under Maintenance': 'تحت الصيانة',
            'Waiting Parts': 'بانتظار قطع الغيار',
            'Ready': 'جاهز للتسليم',
            'Delivered': 'تم التسليم'
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

    /**
     * Calculate progress percentage
     */
    calculateProgress(request) {
        const statusFlow = [
            'Received',
            'Waiting Inspection',
            'Under Maintenance',
            'Waiting Parts',
            'Ready',
            'Delivered'
        ];

        const currentIndex = statusFlow.indexOf(request.status);
        return ((currentIndex + 1) / statusFlow.length) * 100;
    }

    /**
     * Get status color class
     */
    getStatusClass(status) {
        const statusClasses = {
            'Received': 'status-received',
            'Waiting Inspection': 'status-waiting-inspection',
            'Under Maintenance': 'status-under-maintenance',
            'Waiting Parts': 'status-waiting-parts',
            'Ready': 'status-ready',
            'Delivered': 'status-delivered'
        };
        return statusClasses[status] || 'status-received';
    }

    /**
     * Render request form
     */
    renderRequestForm() {
        const form = document.getElementById('requestForm');
        if (!form) return;

        // Handle request type selection
        const requestTypeSelect = document.getElementById('requestTypeSelect');
        if (requestTypeSelect) {
            requestTypeSelect.addEventListener('change', (e) => {
                const requestType = e.target.value;
                if (requestType === 'bulk') {
                    window.location.href = 'bulk-customer.html';
                } else if (requestType === 'company') {
                    window.location.href = 'company-customer.html';
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                requestType: form.querySelector('[name="requestType"]').value,
                fullName: form.querySelector('[name="fullName"]').value,
                phone: form.querySelector('[name="phone"]').value,
                referralCode: form.querySelector('[name="referralCode"]') ? form.querySelector('[name="referralCode"]').value : '',
                laptopBrand: form.querySelector('[name="laptopBrand"]').value,
                laptopModel: form.querySelector('[name="laptopModel"]').value,
                serialNumber: form.querySelector('[name="serialNumber"]').value,
                receivedDate: form.querySelector('[name="receivedDate"]').value,
                problemDescription: form.querySelector('[name="problemDescription"]').value,
                priority: form.querySelector('[name="priority"]') ? form.querySelector('[name="priority"]').value : 'Medium',
                deviceImage: form.querySelector('[name="deviceImage"]').files[0]
            };

            try {
                const responseData = await this.submitRequest(formData);

                alert('تم الإرسال بنجاح!\nرقم الطلب: ' + responseData.requestNumber);

                // Prepare WhatsApp message
                const message = `طلب صيانة:\nالاسم: ${formData.fullName}\nالهاتف: ${formData.phone}\nماركة اللابتوب: ${formData.laptopBrand}\nموديل اللابتوب: ${formData.laptopModel}\nوصف المشكلة: ${formData.problemDescription}`;
                const waUrl = `https://wa.me/201069143785?text=${encodeURIComponent(message)}`;
                window.location.href = waUrl;

                form.reset();
            } catch (error) {
                alert('خطأ: ' + error.message);
            }
        });
    }

    /**
     * Show request success modal
     */
    showRequestSuccess(request) {
        const content = `
            <div style="text-align: center; padding: 1rem;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #10b981; margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 1rem;">Request Submitted Successfully!</h3>
                <p style="margin-bottom: 1rem; color: #94a3b8;">Your request has been received and is being processed.</p>
                <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.25rem;">Your Request Number:</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${request.requestNumber}</p>
                </div>
                <p style="font-size: 0.875rem; color: #94a3b8;">Please save this number for tracking your request status.</p>
            </div>
        `;

        modalManager.create('request-success', 'Success', content);
        modalManager.open('request-success');
    }

    /**
     * Render tracking form
     */
    renderTrackingForm() {
        const form = document.getElementById('trackingForm');
        if (!form) return;

        // Setup instant search and suggestions
        this.setupInstantSearch();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const searchTerm = form.searchTerm.value.trim();
            const searchType = form.searchType.value;
            const requestType = form.requestType ? form.requestType.value : 'single';

            if (!searchTerm) {
                toast.error('يرجى إدخال كلمة البحث');
                return;
            }

            // Save to recent searches
            this.saveRecentSearch(searchTerm, searchType, requestType);

            loading.show('جاري البحث...');

            try {
                let request;
                if (requestType === 'bulk') {
                    request = await this.trackBulkRequest(searchTerm, searchType);
                } else if (requestType === 'company') {
                    request = await this.trackCompanyRequest(searchTerm, searchType);
                } else {
                    request = await this.trackRequest(searchTerm, searchType);
                }
                
                loading.hide();

                if (request) {
                    if (requestType === 'bulk') {
                        this.renderBulkTrackingResult(request);
                    } else if (requestType === 'company') {
                        this.renderCompanyTrackingResult(request);
                    } else {
                        this.renderTrackingResult(request);
                    }
                    toast.success('تم العثور على الطلب!');
                } else {
                    this.renderTrackingError();
                    toast.error('لا يوجد طلب بهذه المعلومات');
                }
            } catch (error) {
                loading.hide();
                console.error('Tracking error:', error);
                toast.error('حدث خطأ أثناء البحث');
            }
        });
    }

    /**
     * Generate star rating HTML
     */
    generateStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
            } else if (i - 0.5 <= rating) {
                stars += '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>';
            } else {
                stars += '<i class="far fa-star" style="color: #d1d5db;"></i>';
            }
        }
        return stars;
    }

    /**
     * Setup instant search functionality
     */
    setupInstantSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchSuggestions = document.getElementById('searchSuggestions');
        const recentSearches = document.getElementById('recentSearches');
        const recentSearchesList = document.getElementById('recentSearchesList');

        if (!searchInput) return;

        // Load recent searches
        this.loadRecentSearches();

        // Instant search with debounce
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const searchTerm = e.target.value.trim();

            if (searchTerm.length < 2) {
                searchSuggestions.style.display = 'none';
                return;
            }

            debounceTimer = setTimeout(() => {
                this.showSearchSuggestions(searchTerm);
            }, 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
                searchSuggestions.style.display = 'none';
            }
        });
    }

    /**
     * Show search suggestions
     */
    async showSearchSuggestions(searchTerm) {
        const searchSuggestions = document.getElementById('searchSuggestions');
        if (!searchSuggestions) return;

        try {
            // Fetch all requests for suggestions
            const response = await fetch('/api/requests');
            const requests = await response.json();

            const suggestions = [];

            // Search by phone
            requests.forEach(req => {
                if (req.phone && req.phone.includes(searchTerm)) {
                    suggestions.push({
                        type: 'رقم الهاتف',
                        value: req.phone,
                        requestNumber: req.requestNumber
                    });
                }
            });

            // Search by name
            requests.forEach(req => {
                const fullName = req.fullName || req.full_name || '';
                if (fullName.toLowerCase().includes(searchTerm.toLowerCase())) {
                    suggestions.push({
                        type: 'الاسم',
                        value: fullName,
                        requestNumber: req.requestNumber
                    });
                }
            });

            // Search by request number
            requests.forEach(req => {
                if (req.requestNumber && req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase())) {
                    suggestions.push({
                        type: 'رقم الطلب',
                        value: req.requestNumber,
                        requestNumber: req.requestNumber
                    });
                }
            });

            // Remove duplicates and limit to 5
            const uniqueSuggestions = [...new Map(suggestions.map(s => [s.value, s])).values()].slice(0, 5);

            if (uniqueSuggestions.length > 0) {
                searchSuggestions.innerHTML = uniqueSuggestions.map(s => `
                    <div class="search-suggestion-item" data-value="${s.value}" data-type="${s.type}">
                        <div class="suggestion-type">${s.type}</div>
                        <div class="suggestion-value">${s.value}</div>
                    </div>
                `).join('');

                // Add click handlers
                searchSuggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        document.getElementById('searchInput').value = item.dataset.value;
                        searchSuggestions.style.display = 'none';
                        document.getElementById('trackingForm').dispatchEvent(new Event('submit'));
                    });
                });

                searchSuggestions.style.display = 'block';
            } else {
                searchSuggestions.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            searchSuggestions.style.display = 'none';
        }
    }

    /**
     * Save recent search
     */
    saveRecentSearch(searchTerm, searchType, requestType) {
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        
        // Remove if already exists
        const index = recentSearches.findIndex(s => s.value === searchTerm);
        if (index > -1) {
            recentSearches.splice(index, 1);
        }

        // Add to beginning
        recentSearches.unshift({
            value: searchTerm,
            type: searchType,
            requestType: requestType,
            timestamp: new Date().toISOString()
        });

        // Keep only last 5
        const recentSearchesLimited = recentSearches.slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(recentSearchesLimited));

        this.loadRecentSearches();
    }

    /**
     * Load recent searches
     */
    loadRecentSearches() {
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const recentSearchesDiv = document.getElementById('recentSearches');
        const recentSearchesList = document.getElementById('recentSearchesList');

        if (!recentSearchesDiv || !recentSearchesList) return;

        if (recentSearches.length > 0) {
            recentSearchesDiv.style.display = 'block';
            recentSearchesList.innerHTML = recentSearches.map((search, index) => `
                <div class="recent-search-tag" data-index="${index}">
                    <span>${search.value}</span>
                    <span class="remove-search" data-index="${index}">×</span>
                </div>
            `).join('');

            // Add click handlers for search tags
            recentSearchesList.querySelectorAll('.recent-search-tag').forEach(tag => {
                tag.addEventListener('click', (e) => {
                    if (e.target.classList.contains('remove-search')) {
                        e.stopPropagation();
                        this.removeRecentSearch(parseInt(e.target.dataset.index));
                    } else {
                        const index = parseInt(tag.dataset.index);
                        const search = recentSearches[index];
                        document.getElementById('searchInput').value = search.value;
                        document.querySelector('[name="searchType"]').value = search.type;
                        if (document.querySelector('[name="requestType"]')) {
                            document.querySelector('[name="requestType"]').value = search.requestType;
                        }
                        document.getElementById('trackingForm').dispatchEvent(new Event('submit'));
                    }
                });
            });
        } else {
            recentSearchesDiv.style.display = 'none';
        }
    }

    /**
     * Remove recent search
     */
    removeRecentSearch(index) {
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        recentSearches.splice(index, 1);
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        this.loadRecentSearches();
    }

    /**
     * Render tracking result
     */
    renderTrackingResult(request) {
        const container = document.getElementById('trackingResult');
        if (!container) return;

        const progress = this.calculateProgress(request);
        const timeline = this.getRequestTimeline(request);
        const statusClass = this.getStatusClass(request.status);
        const stages = this.getProgressStages(request.status);

        container.innerHTML = `
            <div class="glass-card tracking-result">
                <div class="tracking-header">
                    <div>
                        <h2>${request.requestNumber}</h2>
                    </div>
                    <div class="date-info">
                        <p class="tracking-info-label">تاريخ التقديم</p>
                        <p class="tracking-info-value">${Utils.formatDate(request.createdAt)}</p>
                    </div>
                </div>

                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                        ${stages.map(stage => `
                            <div class="progress-step ${stage.active ? 'active' : ''} ${stage.completed ? 'completed' : ''}">
                                <div class="progress-step-circle">
                                    ${stage.completed ? '<i class="fas fa-check"></i>' : (stage.active ? '<i class="fas fa-cog fa-spin"></i>' : stage.icon)}
                                </div>
                                <div class="progress-step-label">${stage.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tracking-info">
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">اسم العميل</p>
                        <p class="tracking-info-value">${request.fullName}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">رقم الهاتف</p>
                        <p class="tracking-info-value">${request.phone}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">الجهاز</p>
                        <p class="tracking-info-value">${request.laptopBrand} ${request.laptopModel || ''}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">تاريخ الاستلام المتوقع</p>
                        <p class="tracking-info-value" style="color: #10b981; font-weight: 600;">${request.estimatedCompletionDate ? Utils.formatDate(request.estimatedCompletionDate) : 'لم يحدد بعد'}</p>
                    </div>
                </div>

                <h3 style="margin: 2rem 0 1rem;">مسار حالة الطلب</h3>
                <div class="timeline">
                    ${timeline.map(item => `
                        <div class="timeline-item ${item.completed ? 'completed' : ''}">
                            <h4>${this.translateStatus(item.status)}</h4>
                            <p>${item.date ? Utils.formatDate(item.date) : 'قيد الانتظار'}</p>
                        </div>
                    `).join('')}
                </div>

                ${request.technicianNotes ? `
                    <div style="margin-top: 2rem; padding: 1rem; background: var(--card-bg-subtle); border-radius: 8px;">
                        <h4 style="margin-bottom: 0.5rem;">ملاحظات الفني</h4>
                        <p style="color: var(--text-muted-more);">${request.technicianNotes}</p>
                    </div>
                ` : ''}

                ${request.adminReply ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <h4 style="margin-bottom: 0.5rem; color: #3b82f6;">رد الإدارة</h4>
                        <p style="color: var(--text-muted);">${request.adminReply}</p>
                        ${request.cost > 0 ? `
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(59, 130, 246, 0.2);">
                                <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">التكلفة:</p>
                                <p style="font-weight: 600; color: #3b82f6; font-size: 1.1rem;">${Utils.formatCurrency(request.cost)}</p>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                ${request.estimatedCompletionDate ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                        <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">تاريخ الاستلام المتوقع:</p>
                        <p style="font-weight: 500; color: #10b981;">${Utils.formatDate(request.estimatedCompletionDate)}</p>
                    </div>
                ` : ''}

                ${request.status === 'Completed' && !request.rating ? `
                    <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.3);">
                        <h3 style="margin-bottom: 1rem; color: #fbbf24;">قيم خدمتنا</h3>
                        <p style="color: var(--text-muted); margin-bottom: 1rem;">كيف كانت تجربتك معنا؟</p>
                        <div id="ratingForm">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; justify-content: center;">
                                ${[1, 2, 3, 4, 5].map(star => `
                                    <button type="button" class="rating-star" data-rating="${star}" style="background: none; border: none; font-size: 2rem; cursor: pointer; color: #d1d5db; transition: color 0.2s;">
                                        <i class="fas fa-star"></i>
                                    </button>
                                `).join('')}
                            </div>
                            <textarea class="form-textarea" id="ratingComment" rows="3" placeholder="أضف تعليقك (اختياري)" style="margin-bottom: 1rem;"></textarea>
                            <button type="button" id="submitRating" class="btn btn-primary" style="width: 100%;" disabled>
                                <i class="fas fa-paper-plane"></i>
                                إرسال التقييم
                            </button>
                        </div>
                    </div>
                ` : ''}

                ${request.rating ? `
                    <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(251, 191, 36, 0.1); border-radius: 8px;">
                        <h3 style="margin-bottom: 1rem; color: #fbbf24;">تقييمك</h3>
                        <div style="display: flex; gap: 0.25rem; margin-bottom: 0.5rem;">
                            ${this.generateStarRating(request.rating)}
                        </div>
                        ${request.ratingComment ? `<p style="color: var(--text-muted);">"${request.ratingComment}"</p>` : ''}
                    </div>
                ` : ''}

                ${request.cost > 0 ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">التكلفة التقديرية:</p>
                        <p style="font-weight: 500; color: #3b82f6;">${Utils.formatCurrency(request.cost)}</p>
                    </div>
                ` : ''}
            </div>
        `;

        // Add rating form event listeners
        this.setupRatingForm(request.id);
    }

    /**
     * Setup rating form event listeners
     */
    setupRatingForm(requestId) {
        const ratingStars = document.querySelectorAll('.rating-star');
        const submitButton = document.getElementById('submitRating');
        const commentInput = document.getElementById('ratingComment');
        let selectedRating = 0;

        ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                
                // Update star colors
                ratingStars.forEach(s => {
                    const rating = parseInt(s.dataset.rating);
                    if (rating <= selectedRating) {
                        s.style.color = '#fbbf24';
                    } else {
                        s.style.color = '#d1d5db';
                    }
                });

                // Enable submit button
                submitButton.disabled = false;
            });

            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                ratingStars.forEach(s => {
                    const sRating = parseInt(s.dataset.rating);
                    if (sRating <= rating) {
                        s.style.color = '#fbbf24';
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                ratingStars.forEach(s => {
                    const rating = parseInt(s.dataset.rating);
                    if (rating <= selectedRating) {
                        s.style.color = '#fbbf24';
                    } else {
                        s.style.color = '#d1d5db';
                    }
                });
            });
        });

        if (submitButton) {
            submitButton.addEventListener('click', async () => {
                if (selectedRating === 0) {
                    toast.error('يرجى اختيار تقييم');
                    return;
                }

                loading.show('جاري إرسال التقييم...');

                try {
                    const comment = commentInput ? commentInput.value : '';
                    
                    // In production, this would call the API
                    // For now, we'll update the local storage
                    const storage = new LocalStorage();
                    const request = await storage.getRequestById(requestId);
                    
                    if (request) {
                        request.rating = selectedRating;
                        request.ratingComment = comment;
                        request.ratedAt = new Date().toISOString();
                        await storage.updateRequest(requestId, request);
                    }

                    loading.hide();
                    toast.success('شكراً لتقييمك!');

                    // Refresh the tracking result
                    const refreshedRequest = await this.trackRequest(this.currentSearchTerm, this.currentSearchType);
                    if (refreshedRequest) {
                        this.renderTrackingResult(refreshedRequest);
                    }
                } catch (error) {
                    loading.hide();
                    toast.error('فشل إرسال التقييم. يرجى المحاولة مجدداً.');
                    console.error(error);
                }
            });
        }
    }

    /**
     * Render tracking error
     */
    renderTrackingError() {
        const container = document.getElementById('trackingResult');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 4rem; color: #64748b; margin-bottom: 1rem;"></i>
                <h3 style="margin-bottom: 0.5rem;">لم يتم العثور على الطلب</h3>
                <p style="color: #94a3b8;">لا يوجد طلب بهذه المعلومات. يرجى التحقق من رقم الهاتف أو رقم الطلب والمحاولة مجدداً.</p>
                <button class="btn btn-primary" onclick="document.getElementById('trackingForm').reset(); document.getElementById('trackingResult').innerHTML = '';" style="margin-top: 1rem;">
                    حاول مجدداً
                </button>
            </div>
        `;
    }

    /**
     * Render bulk request tracking result
     */
    renderBulkTrackingResult(bulkRequest) {
        const container = document.getElementById('trackingResult');
        if (!container) return;

        const progress = this.calculateProgress(bulkRequest);
        const timeline = this.getRequestTimeline(bulkRequest);
        const statusClass = this.getStatusClass(bulkRequest.status);
        const stages = this.getProgressStages(bulkRequest.status);

        console.log('📦 Bulk request data:', bulkRequest);
        console.log('📦 Estimated completion date:', bulkRequest.estimatedCompletionDate);

        container.innerHTML = `
            <div class="glass-card tracking-result">
                <div class="tracking-header">
                    <div>
                        <h2>${bulkRequest.requestNumber}</h2>
                        <span style="color: #94a3b8; font-size: 0.875rem;">طلب جملة</span>
                    </div>
                    <div class="date-info">
                        <p class="tracking-info-label">تاريخ التقديم</p>
                        <p class="tracking-info-value">${Utils.formatDate(bulkRequest.createdAt)}</p>
                    </div>
                </div>

                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                        ${stages.map(stage => `
                            <div class="progress-step ${stage.active ? 'active' : ''} ${stage.completed ? 'completed' : ''}">
                                <div class="progress-step-circle">
                                    ${stage.completed ? '<i class="fas fa-check"></i>' : (stage.active ? '<i class="fas fa-cog fa-spin"></i>' : stage.icon)}
                                </div>
                                <div class="progress-step-label">${stage.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tracking-info">
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">اسم العميل</p>
                        <p class="tracking-info-value">${bulkRequest.customerName}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">رقم الهاتف</p>
                        <p class="tracking-info-value">${bulkRequest.customerPhone}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">عدد الأجهزة</p>
                        <p class="tracking-info-value">${bulkRequest.deviceCount}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">تاريخ الاستلام المتوقع</p>
                        <p class="tracking-info-value" style="color: #10b981; font-weight: 600;">${bulkRequest.estimatedCompletionDate || bulkRequest.estimated_completion_date ? Utils.formatDate(bulkRequest.estimatedCompletionDate || bulkRequest.estimated_completion_date) : 'لم يحدد بعد'}</p>
                    </div>
                </div>

                <h3 style="margin: 2rem 0 1rem;">مسار حالة الطلب</h3>
                <div class="timeline">
                    ${timeline.map(item => `
                        <div class="timeline-item ${item.completed ? 'completed' : ''}">
                            <h4>${this.translateStatus(item.status)}</h4>
                            <p>${item.date ? Utils.formatDate(item.date) : 'قيد الانتظار'}</p>
                        </div>
                    `).join('')}
                </div>

                ${bulkRequest.devices && bulkRequest.devices.length > 0 ? `
                    <h3 style="margin: 2rem 0 1rem;">الأجهزة المرسلة</h3>
                    <div style="overflow-x: auto;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الماركة</th>
                                    <th>الموديل</th>
                                    <th>الرقم التسلسلي</th>
                                    <th>تاريخ الاستلام</th>
                                    <th>تاريخ الاستلام المتوقع</th>
                                    <th>الأولوية</th>
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
                                        <td style="color: #10b981; font-weight: 600;">${device.estimatedCompletionDate || device.estimated_completion_date ? Utils.formatDate(device.estimatedCompletionDate || device.estimated_completion_date) : 'لم يحدد بعد'}</td>
                                        <td><span class="priority-badge ${this.getStatusClass(device.priority)}">${this.translatePriority(device.priority)}</span></td>
                                        <td><span class="status-badge ${this.getStatusClass(device.status)}">${this.translateStatus(device.status)}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                ${bulkRequest.adminReply ? `
                    <div style="margin-top: 2rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <h4 style="margin-bottom: 0.5rem; color: #3b82f6;">رد الإدارة</h4>
                        <p style="color: var(--text-muted);">${bulkRequest.adminReply}</p>
                        ${bulkRequest.cost > 0 ? `
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(59, 130, 246, 0.2);">
                                <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">التكلفة:</p>
                                <p style="font-weight: 600; color: #3b82f6; font-size: 1.1rem;">${Utils.formatCurrency(bulkRequest.cost)}</p>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                ${bulkRequest.technician ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                        <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">الفني المسؤول:</p>
                        <p style="font-weight: 500; color: #10b981;">${bulkRequest.technician}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render company request tracking result
     */
    renderCompanyTrackingResult(companyRequest) {
        const container = document.getElementById('trackingResult');
        if (!container) return;

        const progress = this.calculateProgress(companyRequest);
        const timeline = this.getRequestTimeline(companyRequest);
        const statusClass = this.getStatusClass(companyRequest.status);
        const stages = this.getProgressStages(companyRequest.status);

        container.innerHTML = `
            <div class="glass-card tracking-result">
                <div class="tracking-header">
                    <div>
                        <h2>${companyRequest.requestNumber}</h2>
                        <span style="color: #94a3b8; font-size: 0.875rem;">موظفي الشركة</span>
                    </div>
                    <div class="date-info">
                        <p class="tracking-info-label">تاريخ التقديم</p>
                        <p class="tracking-info-value">${Utils.formatDate(companyRequest.createdAt)}</p>
                    </div>
                </div>

                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                        ${stages.map(stage => `
                            <div class="progress-step ${stage.active ? 'active' : ''} ${stage.completed ? 'completed' : ''}">
                                <div class="progress-step-circle">
                                    ${stage.completed ? '<i class="fas fa-check"></i>' : (stage.active ? '<i class="fas fa-cog fa-spin"></i>' : stage.icon)}
                                </div>
                                <div class="progress-step-label">${stage.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tracking-info">
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">الاسم</p>
                        <p class="tracking-info-value">${companyRequest.fullName || companyRequest.full_name}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">رقم الهاتف</p>
                        <p class="tracking-info-value">${companyRequest.phone}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">الجهاز</p>
                        <p class="tracking-info-value">${companyRequest.laptopBrand || companyRequest.laptop_brand} ${companyRequest.laptopModel || companyRequest.laptop_model || ''}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">الرقم التسلسلي</p>
                        <p class="tracking-info-value" dir="ltr">${companyRequest.serialNumber || companyRequest.serial_number || '—'}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">تاريخ الاستلام</p>
                        <p class="tracking-info-value">${companyRequest.receivedDate || companyRequest.received_date ? Utils.formatDate(companyRequest.receivedDate || companyRequest.received_date) : '—'}</p>
                    </div>
                    <div class="tracking-info-item">
                        <p class="tracking-info-label">تاريخ الاستلام المتوقع</p>
                        <p class="tracking-info-value" style="color: #10b981; font-weight: 600;">${companyRequest.estimatedCompletionDate || companyRequest.estimated_completion_date ? Utils.formatDate(companyRequest.estimatedCompletionDate || companyRequest.estimated_completion_date) : 'لم يحدد بعد'}</p>
                    </div>
                </div>

                <h3 style="margin: 2rem 0 1rem;">مسار حالة الطلب</h3>
                <div class="timeline">
                    ${timeline.map(item => `
                        <div class="timeline-item ${item.completed ? 'completed' : ''}">
                            <h4>${this.translateStatus(item.status)}</h4>
                            <p>${item.date ? Utils.formatDate(item.date) : 'قيد الانتظار'}</p>
                        </div>
                    `).join('')}
                </div>

                <h3 style="margin: 2rem 0 1rem;">وصف المشكلة</h3>
                <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                    <p style="color: var(--text-muted);">${companyRequest.problemDescription || companyRequest.problem_description}</p>
                </div>

                ${companyRequest.adminReply || companyRequest.admin_reply ? `
                    <div style="margin-top: 2rem; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <h4 style="margin-bottom: 0.5rem; color: #3b82f6;">رد الإدارة</h4>
                        <p style="color: var(--text-muted);">${companyRequest.adminReply || companyRequest.admin_reply}</p>
                        ${companyRequest.cost > 0 ? `
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(59, 130, 246, 0.2);">
                                <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">التكلفة:</p>
                                <p style="font-weight: 600; color: #3b82f6; font-size: 1.1rem;">${Utils.formatCurrency(companyRequest.cost)}</p>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                ${companyRequest.technician ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                        <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">الفني المسؤول:</p>
                        <p style="font-weight: 500; color: #10b981;">${companyRequest.technician}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Get progress stages based on request status
     */
    getProgressStages(status) {
        const stages = [
            { label: 'استلام', icon: '<i class="fas fa-inbox"></i>', completed: false, active: false },
            { label: 'تشخيص', icon: '<i class="fas fa-search"></i>', completed: false, active: false },
            { label: 'إصلاح', icon: '<i class="fas fa-tools"></i>', completed: false, active: false },
            { label: 'اختبار', icon: '<i class="fas fa-check-circle"></i>', completed: false, active: false },
            { label: 'جاهز', icon: '<i class="fas fa-check-double"></i>', completed: false, active: false },
            { label: 'تم التسليم', icon: '<i class="fas fa-check"></i>', completed: false, active: false }
        ];

        const statusMap = {
            'Received': 0,
            'Diagnosing': 1,
            'Repairing': 2,
            'Testing': 3,
            'Ready': 4,
            'Completed': 4,
            'Delivered': 5,
            'HandedOver': 5
        };

        const currentIndex = statusMap[status] || 0;

        stages.forEach((stage, index) => {
            if (index < currentIndex) {
                // Previous stages are completed (green)
                stage.completed = true;
                stage.active = false;
            } else if (index === currentIndex) {
                // Current stage is active (blue)
                stage.completed = false;
                stage.active = true;
            } else {
                // Future stages are inactive (gray)
                stage.completed = false;
                stage.active = false;
            }
        });

        return stages;
    }

    /**
     * Initialize customer functionality
     */
    init() {
        this.renderRequestForm();
        this.renderTrackingForm();
    }
}

// Create global instance
const customerManager = new CustomerManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    customerManager.init();
});
