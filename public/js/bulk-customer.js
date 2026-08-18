class BulkCustomerManager {
    constructor() {
        this.devices = [];
        this.init();
    }

    init() {
        this.renderDevices();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('bulkRequestForm');
        const addDeviceBtn = document.getElementById('addDeviceBtn');
        const deviceCountInput = document.getElementById('deviceCount');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        addDeviceBtn.addEventListener('click', () => this.addDevice());
        deviceCountInput.addEventListener('change', (e) => this.updateDeviceCount(e.target.value));
    }

    updateDeviceCount(count) {
        const numDevices = parseInt(count);
        const currentDevices = this.devices.length;

        if (numDevices > currentDevices) {
            // Add more devices
            for (let i = currentDevices; i < numDevices; i++) {
                this.addDevice();
            }
        } else if (numDevices < currentDevices) {
            // Remove devices
            this.devices = this.devices.slice(0, numDevices);
            this.renderDevices();
        }
    }

    addDevice() {
        const deviceId = Date.now();
        this.devices.push({
            id: deviceId,
            laptopBrand: '',
            laptopModel: '',
            serialNumber: '',
            problemDescription: ''
        });
        this.renderDevices();
    }

    removeDevice(deviceId) {
        if (this.devices.length > 2) {
            this.devices = this.devices.filter(d => d.id !== deviceId);
            this.renderDevices();
            document.getElementById('deviceCount').value = this.devices.length;
        } else {
            alert('يجب أن يكون هناك على الأقل 2 لابتوب في طلب الجملة');
        }
    }

    renderDevices() {
        const container = document.getElementById('devicesContainer');
        
        container.innerHTML = this.devices.map((device, index) => `
            <div class="device-card" style="background: rgba(255, 255, 255, 0.05); padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="color: #3b82f6; margin: 0;"><i class="fas fa-laptop"></i> اللابتوب #${index + 1}</h4>
                    ${this.devices.length > 2 ? `
                        <button type="button" onclick="bulkCustomerManager.removeDevice(${device.id})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">ماركة اللابتوب *</label>
                        <select class="form-select" name="laptopBrand_${device.id}" required>
                            <option value="">اختر الماركة</option>
                            <option value="HP">HP</option>
                            <option value="Dell">Dell</option>
                            <option value="Lenovo">Lenovo</option>
                            <option value="Asus">Asus</option>
                            <option value="Acer">Acer</option>
                            <option value="Toshiba">Toshiba</option>
                            <option value="Samsung">Samsung</option>
                            <option value="Sony">Sony</option>
                            <option value="MSI">MSI</option>
                            <option value="Apple">Apple (MacBook)</option>
                            <option value="Other">أخرى</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">الموديل</label>
                        <input type="text" class="form-input" name="laptopModel_${device.id}" placeholder="مثال: Pavilion 15">
                    </div>
                    <div class="form-group">
                        <label class="form-label">الرقم التسلسلي</label>
                        <input type="text" class="form-input" name="serialNumber_${device.id}" placeholder="SN: ..." dir="ltr">
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">وصف المشكلة *</label>
                        <textarea class="form-textarea" name="problemDescription_${device.id}" rows="3" required placeholder="اشرح المشكلة بالتفصيل..."></textarea>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Collect customer info
        const customerData = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            deviceCount: parseInt(formData.get('deviceCount'))
        };

        // Collect devices data
        const devicesData = this.devices.map(device => ({
            laptopBrand: formData.get(`laptopBrand_${device.id}`),
            laptopModel: formData.get(`laptopModel_${device.id}`),
            serialNumber: formData.get(`serialNumber_${device.id}`),
            problemDescription: formData.get(`problemDescription_${device.id}`)
        }));

        // Validate
        if (devicesData.some(d => !d.laptopBrand || !d.problemDescription)) {
            alert('يرجى ملء جميع الحقول المطلوبة لكل لابتوب');
            return;
        }

        try {
            // Create individual requests for each device
            const requests = [];
            for (let i = 0; i < devicesData.length; i++) {
                const device = devicesData[i];
                const requestData = {
                    ...customerData,
                    ...device,
                    requestType: 'bulk',
                    status: 'Received',
                    priority: 'Medium'
                };

                const response = await fetch('/api/requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (!response.ok) throw new Error('Failed to create request');
                
                const result = await response.json();
                requests.push(result);
            }

            // Show success message with all request numbers
            const requestNumbers = requests.map(r => r.request_number).join(', ');
            alert(`تم إرسال طلب الجملة بنجاح!\n\nأرقام الطلبات: ${requestNumbers}\nعدد اللابتوبات: ${requests.length}\n\nسيتم التواصل معك قريباً لتأكيد الحجز.`);

            // Redirect to WhatsApp
            const message = `طلب صيانة جملة:\nالاسم: ${customerData.fullName}\nالهاتف: ${customerData.phone}\nعدد اللابتوبات: ${customerData.deviceCount}\nأرقام الطلبات: ${requestNumbers}`;
            const waUrl = `https://wa.me/201069143785?text=${encodeURIComponent(message)}`;
            window.location.href = waUrl;

        } catch (error) {
            console.error('Error submitting bulk request:', error);
            alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bulkCustomerManager = new BulkCustomerManager();
});
