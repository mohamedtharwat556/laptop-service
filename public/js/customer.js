/**
 * YAS Laptop Service Center - Customer Module
 * Handles maintenance requests and tracking for customers
 */

class CustomerManager {
    constructor() {
        this.currentRequest = null;
    }

    /**
     * Submit a maintenance request
     */
    async submitRequest(formData) {
        // Generate request number
        const requestNumber = 'REQ-' + Date.now().toString().slice(-6);

        const requestData = {
            requestNumber: requestNumber,
            fullName: formData.fullName,
            phone: formData.phone,
            laptopBrand: formData.laptopBrand,
            laptopModel: formData.laptopModel,
            deviceType: formData.deviceType,
            problemDescription: formData.problemDescription,
            priority: formData.priority || 'Medium',
            receivedDate: formData.receivedDate || new Date().toISOString().slice(0, 10),

            deviceImage: formData.deviceImage || null,
            notes: '',
            technicianNotes: '',
            cost: 0,
            estimatedCompletionDate: null,
            replacementParts: [],
            repairImages: []
        };

        const request = await storage.createRequest(requestData);
        this.currentRequest = request;

        return request;
    }

    /**
     * Track a request by name, phone number or request number
     */
    trackRequest(searchTerm, searchType = 'phone') {
        let request;
        
        if (searchType === 'phone') {
            const requests = storage.getRequestsByPhone(searchTerm);
            request = requests.length > 0 ? requests[requests.length - 1] : null;
        } else if (searchType === 'name') {
            const requests = storage.getRequestsByName(searchTerm);
            request = requests.length > 0 ? requests[requests.length - 1] : null;
        } else {
            request = storage.getRequestByNumber(searchTerm);
        }
        
        // Store current search for refresh
        this.currentSearchTerm = searchTerm;
        this.currentSearchType = searchType;
        
        return request;
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

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            loading.show('Submitting your request...');

            const formData = {
                requestNumber: 'REQ-' + Date.now(),
                fullName: form.querySelector('[name="fullName"]').value,
                phone: form.querySelector('[name="phone"]').value,
                laptopBrand: form.querySelector('[name="laptopBrand"]').value,
                laptopModel: form.querySelector('[name="laptopModel"]').value,
                deviceType: form.querySelector('[name="deviceType"]').value,
                problemDescription: form.querySelector('[name="problemDescription"]').value,
                priority: form.querySelector('[name="priority"]') ? form.querySelector('[name="priority"]').value : 'Medium'
            };

            console.log('Sending data:', formData);

            try {
                const response = await fetch('/api/requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                console.log('Response status:', response.status);
                const responseData = await response.json();
                console.log('Response data:', responseData);

                if (response.ok) {
                    loading.hide();
                    this.showRequestSuccess(responseData);

                    // Prepare WhatsApp message
                    const message = `طلب صيانة:\nالاسم: ${formData.fullName}\nالهاتف: ${formData.phone}\nماركة اللابتوب: ${formData.laptopBrand}\nنوع الجهاز: ${formData.deviceType}\nوصف المشكلة: ${formData.problemDescription}`;
                    const waUrl = `https://wa.me/201013791517?text=${encodeURIComponent(message)}`;
                    window.location.href = waUrl;

                    form.reset();
                    toast.success('تم الإرسال بنجاح!');
                } else {
                    loading.hide();
                    toast.error('فشل الإرسال: ' + JSON.stringify(responseData));
                }
            } catch (error) {
                loading.hide();
                toast.error('خطأ: ' + error.message);
                console.error('Error:', error);
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

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const searchTerm = form.searchTerm.value.trim();
            const searchType = form.searchType.value;

            if (!searchTerm) {
                toast.error('Please enter a phone number or request number');
                return;
            }

            loading.show('Searching for your request...');

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                const request = this.trackRequest(searchTerm, searchType);
                loading.hide();

                if (request) {
                    this.renderTrackingResult(request);
                    toast.success('تم العثور على الطلب!');
                } else {
                    this.renderTrackingError();
                    toast.error('لا يوجد طلب بهذه المعلومات');
                }
            } catch (error) {
                loading.hide();
                toast.error('فشل البحث. يرجى المحاولة مجدداً.');
                console.error(error);
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
     * Render tracking result
     */
    renderTrackingResult(request) {
        const container = document.getElementById('trackingResult');
        if (!container) return;

        const progress = this.calculateProgress(request);
        const timeline = this.getRequestTimeline(request);
        const statusClass = this.getStatusClass(request.status);

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
                    <div class="progress-bar" style="width: ${progress}%"></div>
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
                        <p class="tracking-info-value">${request.laptopBrand}${request.laptopModel ? ' ' + request.laptopModel : ''}</p>
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
                    this.trackRequest(this.currentSearchTerm, this.currentSearchType);
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
