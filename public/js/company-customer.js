class CompanyCustomerManager {
    constructor() {
        this.init();
    }

    init() {
        this.renderRequestForm();
    }

    /**
     * Render company request form
     */
    renderRequestForm() {
        const form = document.getElementById('companyRequestForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                companyName: form.querySelector('[name="companyName"]').value,
                companyPhone: form.querySelector('[name="companyPhone"]').value,
                companyEmail: form.querySelector('[name="companyEmail"]').value,
                commercialRegister: form.querySelector('[name="commercialRegister"]').value,
                contactPerson: form.querySelector('[name="contactPerson"]').value,
                contactPersonPhone: form.querySelector('[name="contactPersonPhone"]').value,
                laptopBrand: form.querySelector('[name="laptopBrand"]').value,
                laptopModel: form.querySelector('[name="laptopModel"]').value,
                serialNumber: form.querySelector('[name="serialNumber"]').value,
                receivedDate: form.querySelector('[name="receivedDate"]').value,
                problemDescription: form.querySelector('[name="problemDescription"]').value,
                priority: form.querySelector('[name="priority"]').value,
                deviceImage: form.querySelector('[name="deviceImage"]').files[0]
            };

            // Handle laptop brand selection
            const laptopBrandSelect = form.querySelector('[name="laptopBrand"]');
            const laptopBrandOther = form.querySelector('[name="laptopBrandOther"]');
            if (laptopBrandSelect.value === 'Other' && laptopBrandOther) {
                formData.laptopBrand = laptopBrandOther.value;
            }

            try {
                const responseData = await this.submitRequest(formData);

                alert('تم الإرسال بنجاح!\nرقم الطلب: ' + responseData.requestNumber);

                // Prepare WhatsApp message
                const message = `طلب صيانة شركة:\nاسم الشركة: ${formData.companyName}\nهاتف الشركة: ${formData.companyPhone}\nماركة اللابتوب: ${formData.laptopBrand}\nموديل اللابتوب: ${formData.laptopModel}\nوصف المشكلة: ${formData.problemDescription}`;
                const waUrl = `https://wa.me/201069143785?text=${encodeURIComponent(message)}`;
                window.location.href = waUrl;

                form.reset();
            } catch (error) {
                alert('خطأ: ' + error.message);
            }
        });
    }

    /**
     * Submit company request to API
     */
    async submitRequest(formData) {
        try {
            console.log('📦 Submitting company request...');
            console.log('Company data:', formData);

            const requestData = {
                companyName: formData.companyName,
                companyPhone: formData.companyPhone,
                companyEmail: formData.companyEmail,
                commercialRegister: formData.commercialRegister,
                contactPerson: formData.contactPerson,
                contactPersonPhone: formData.contactPersonPhone,
                laptopBrand: formData.laptopBrand,
                laptopModel: formData.laptopModel,
                serialNumber: formData.serialNumber,
                receivedDate: formData.receivedDate,
                problemDescription: formData.problemDescription,
                priority: formData.priority,
                status: 'Received'
            };

            console.log('📤 Sending company request:', requestData);

            const response = await fetch('/api/company-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Company request failed:', errorText);
                throw new Error(`Failed to create company request: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('✅ Company request created:', result);

            return result;
        } catch (error) {
            console.error('❌ Error submitting company request:', error);
            throw error;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.companyCustomerManager = new CompanyCustomerManager();
});
