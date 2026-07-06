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
        const requestData = {
            fullName: formData.fullName,
            phone: formData.phone,
            laptopBrand: formData.laptopBrand,
            laptopModel: formData.laptopModel,
            deviceType: formData.deviceType,
            problemDescription: formData.problemDescription,
            priority: formData.priority || 'Medium',

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
     * Track a request by phone number or request number
     */
    trackRequest(searchTerm, searchType = 'phone') {
        let request;
        
        if (searchType === 'phone') {
            const requests = storage.getRequestsByPhone(searchTerm);
            request = requests.length > 0 ? requests[requests.length - 1] : null;
        } else {
            request = storage.getRequestByNumber(searchTerm);
        }
        
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

        const validator = new FormValidator(form);
        
        // Add validation rules
        validator.addRule('fullName', FormValidator.required('Full name is required'));
        validator.addRule('fullName', FormValidator.minLength(2, 'Name must be at least 2 characters'));
        validator.addRule('phone', FormValidator.required('Phone number is required'));
        validator.addRule('phone', FormValidator.phone('Invalid phone number'));
        validator.addRule('laptopBrand', FormValidator.required('Laptop brand is required'));
        validator.addRule('laptopModel', FormValidator.required('Laptop model is required'));
        validator.addRule('deviceType', FormValidator.required('Device type is required'));
        validator.addRule('problemDescription', FormValidator.required('Problem description is required'));
        validator.addRule('problemDescription', FormValidator.minLength(10, 'Description must be at least 10 characters'));
// validator.addRule('priority', FormValidator.required('Priority is required'));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validator.validate()) {
                toast.error('Please fix the errors in the form');
                return;
            }

            loading.show('Submitting your request...');

            // Simulate file upload if image is selected
            let deviceImage = null;
            const imageInput = form.querySelector('[name="deviceImage"]');
            if (imageInput.files.length > 0) {
                // In a real app, you would upload to a server
                // For demo, we'll use a placeholder
                deviceImage = 'https://via.placeholder.com/400x300/1e3a8a/ffffff?text=Device+Image';
            }

            const formData = {
                fullName: form.fullName.value,
                phone: form.phone.value,
                laptopBrand: form.laptopBrand.value,
                laptopModel: form.laptopModel ? form.laptopModel.value : '',
                deviceType: form.deviceType.value,
                problemDescription: form.problemDescription.value,
                deviceImage: deviceImage
            };

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const request = await this.submitRequest(formData);
        document.dispatchEvent(new CustomEvent('orderAdded', { detail: request }));
            const order = storage.createOrder({
                customerName: formData.fullName,
                laptopBrand: formData.laptopBrand,
                status: 'Received'
            });
                loading.hide();

                // Show success modal
                this.showRequestSuccess(request);

                // Prepare WhatsApp message with the entered data
                const message = `طلب صيانة:\nالاسم: ${formData.fullName}\nالهاتف: ${formData.phone}\nماركة اللابتوب: ${formData.laptopBrand}\nنوع الجهاز: ${formData.deviceType}\nوصف المشكلة: ${formData.problemDescription}`;
                const waUrl = `https://wa.me/201013791517?text=${encodeURIComponent(message)}`;
                window.location.href = waUrl;

                // Reset form
                form.reset();

                toast.success('Request submitted successfully!');
            } catch (error) {
                loading.hide();
                toast.error('Failed to submit request. Please try again.');
                console.error(error);
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
                    </div>
                ` : ''}

                ${request.estimatedCompletionDate ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                        <p style="font-size: 0.875rem; color: var(--text-muted-more); margin-bottom: 0.25rem;">تاريخ الاستلام المتوقع:</p>
                        <p style="font-weight: 500; color: #10b981;">${Utils.formatDate(request.estimatedCompletionDate)}</p>
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
