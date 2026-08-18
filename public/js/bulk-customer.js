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
                <div class="form-group">
                    <label class="form-label">ماركة اللابتوب *</label>
                    <select class="form-input" name="laptopBrand_${device.id}" required id="laptopBrandSelect_${device.id}">
                        <option value="">اختر ماركة اللابتوب</option>
                        <option value="Acer">Acer</option>
                        <option value="Apple">Apple (MacBook)</option>
                        <option value="Asus">Asus</option>
                        <option value="Dell">Dell</option>
                        <option value="HP">HP</option>
                        <option value="Lenovo">Lenovo</option>
                        <option value="MSI">MSI</option>
                        <option value="Microsoft">Microsoft Surface</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Sony">Sony Vaio</option>
                        <option value="Toshiba">Toshiba</option>
                        <option value="LG">LG</option>
                        <option value="Razer">Razer</option>
                        <option value="Gigabyte">Gigabyte</option>
                        <option value="Huawei">Huawei</option>
                        <option value="Xiaomi">Xiaomi</option>
                        <option value="Fujitsu">Fujitsu</option>
                        <option value="Panasonic">Panasonic</option>
                        <option value="Medion">Medion</option>
                        <option value="Packard Bell">Packard Bell</option>
                        <option value="Gateway">Gateway</option>
                        <option value="eMachines">eMachines</option>
                        <option value="Compaq">Compaq</option>
                        <option value="IBM">IBM (Lenovo)</option>
                        <option value="NEC">NEC</option>
                        <option value="Sharp">Sharp</option>
                        <option value="BenQ">BenQ</option>
                        <option value="Sager">Sager</option>
                        <option value="Clevo">Clevo</option>
                        <option value="Origin PC">Origin PC</option>
                        <option value="Alienware">Alienware (Dell)</option>
                        <option value="Other">أخرى</option>
                    </select>
                    <input type="text" class="form-input" name="laptopBrandOther_${device.id}" id="laptopBrandOther_${device.id}" placeholder="أدخل اسم الماركة" style="display: none; margin-top: 0.5rem;"/>
                </div>
                <div class="form-group">
                    <label class="form-label">موديل اللابتوب *</label>
                    <input type="text" class="form-input" name="laptopModel_${device.id}" required placeholder="أدخل موديل اللابتوب"/>
                </div>
                <div class="form-group">
                    <label class="form-label">الرقم التسلسلي (السيريال)</label>
                    <input type="text" class="form-input" name="serialNumber_${device.id}" placeholder="أدخل الرقم التسلسلي الموجود على اللابتوب"/>
                    <p style="font-size: 0.875rem; color: #94a3b8; margin-top: 0.5rem;">موجود عادة على ملصق أسفل اللابتوب أو في البطارية</p>
                </div>
                <div class="form-group">
                    <label class="form-label">تاريخ الاستلام *</label>
                    <input type="date" class="form-input" name="receivedDate_${device.id}" required id="receivedDate_${device.id}">
                </div>
                <div class="form-group">
                    <label class="form-label">الأولوية *</label>
                    <select class="form-input" name="priority_${device.id}" required>
                        <option value="Low">منخفضة</option>
                        <option value="Medium" selected>متوسطة</option>
                        <option value="High">عالية</option>
                        <option value="Urgent">عاجلة</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">وصف المشكلة *</label>
                    <textarea class="form-textarea" name="problemDescription_${device.id}" rows="3" required placeholder="يرجى وصف المشكلة التي تواجهها مع جهازك..."></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">صورة الجهاز (اختياري)</label>
                    <input type="file" class="form-input" name="deviceImage_${device.id}" accept="image/*">
                    <p style="font-size: 0.875rem; color: #94a3b8; margin-top: 0.5rem;">قم برفع صورة للجهاز أو للمشكلة</p>
                </div>
            </div>
        `).join('');

        // Set today's date as default for received date
        this.devices.forEach((device, index) => {
            const receivedDate = document.getElementById(`receivedDate_${device.id}`);
            if (receivedDate) {
                receivedDate.value = new Date().toISOString().slice(0, 10);
            }
            
            // Handle laptop brand selection
            const laptopBrandSelect = document.getElementById(`laptopBrandSelect_${device.id}`);
            const laptopBrandOther = document.getElementById(`laptopBrandOther_${device.id}`);
            
            if (laptopBrandSelect && laptopBrandOther) {
                laptopBrandSelect.addEventListener('change', () => {
                    if (laptopBrandSelect.value === 'Other') {
                        laptopBrandOther.style.display = 'block';
                        laptopBrandOther.required = true;
                    } else {
                        laptopBrandOther.style.display = 'none';
                        laptopBrandOther.required = false;
                        laptopBrandOther.value = '';
                    }
                });
            }
        });
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
        const devicesData = this.devices.map(device => {
            const laptopBrand = formData.get(`laptopBrand_${device.id}`);
            const laptopBrandOther = formData.get(`laptopBrandOther_${device.id}`);
            
            return {
                laptopBrand: laptopBrand === 'Other' ? laptopBrandOther : laptopBrand,
                laptopModel: formData.get(`laptopModel_${device.id}`),
                serialNumber: formData.get(`serialNumber_${device.id}`),
                receivedDate: formData.get(`receivedDate_${device.id}`),
                priority: formData.get(`priority_${device.id}`),
                problemDescription: formData.get(`problemDescription_${device.id}`),
                deviceImage: null // Will handle file upload separately if needed
            };
        });

        // Validate
        if (devicesData.some(d => !d.laptopBrand || !d.laptopModel || !d.problemDescription)) {
            alert('يرجى ملء جميع الحقول المطلوبة لكل لابتوب');
            return;
        }

        try {
            console.log('📦 Submitting bulk request...');
            console.log('Customer data:', customerData);
            console.log('Devices data:', devicesData);

            // Create bulk request with all devices
            const requestData = {
                customerName: customerData.fullName,
                customerPhone: customerData.phone,
                customerEmail: customerData.email,
                deviceCount: customerData.deviceCount,
                devices: devicesData,
                status: 'Received',
                priority: 'Medium'
            };

            console.log('📤 Sending bulk request:', requestData);

            const response = await fetch('/api/bulk-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Bulk request failed:', errorText);
                throw new Error(`Failed to create bulk request: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Bulk request created:', result);

            // Show success message with request number
            alert(`تم إرسال طلب الجملة بنجاح!\n\nرقم الطلب: ${result.requestNumber}\nعدد اللابتوبات: ${result.deviceCount}\n\nسيتم التواصل معك قريباً لتأكيد الحجز.`);

            // Redirect to WhatsApp
            const message = `طلب صيانة جملة:\nالاسم: ${customerData.fullName}\nالهاتف: ${customerData.phone}\nعدد اللابتوبات: ${customerData.deviceCount}\nرقم الطلب: ${result.requestNumber}`;
            const waUrl = `https://wa.me/201069143785?text=${encodeURIComponent(message)}`;
            window.location.href = waUrl;

        } catch (error) {
            console.error('❌ Error submitting bulk request:', error);
            alert(`حدث خطأ أثناء إرسال الطلب: ${error.message}`);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bulkCustomerManager = new BulkCustomerManager();
});
