class CompanyCustomerManager {
    constructor() {
        this.init();
    }

    init() {
        this.renderForm();
    }

    /**
     * Render company request form
     */
    renderForm() {
        const form = document.getElementById('companyRequestForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const laptopBrand = formData.get('laptopBrand');
            const laptopBrandOther = formData.get('laptopBrandOther');
            const finalLaptopBrand = laptopBrand === 'Other' ? laptopBrandOther : laptopBrand;

            const requestData = {
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                laptopBrand: finalLaptopBrand,
                laptopModel: formData.get('laptopModel'),
                serialNumber: formData.get('serialNumber'),
                receivedDate: formData.get('receivedDate'),
                problemDescription: formData.get('problemDescription'),
                priority: formData.get('priority'),
                deviceImage: null
            };

            try {
                console.log('📦 Submitting company request...');
                console.log('Request data:', requestData);

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
                    console.error('❌ Request failed:', errorText);
                    throw new Error(`Failed to create company request: ${errorText}`);
                }
                
                const result = await response.json();
                console.log('✅ Company request created:', result);

                alert('تم الإرسال بنجاح!\nرقم الطلب: ' + result.requestNumber);

                // Prepare WhatsApp message
                const message = `طلب صيانة:\nالاسم: ${requestData.fullName}\nالهاتف: ${requestData.phone}\nماركة اللابتوب: ${requestData.laptopBrand}\nموديل اللابتوب: ${requestData.laptopModel}\nوصف المشكلة: ${requestData.problemDescription}`;
                const waUrl = `https://wa.me/201069143785?text=${encodeURIComponent(message)}`;
                window.location.href = waUrl;

                form.reset();
            } catch (error) {
                console.error('Error submitting company request:', error);
                alert('خطأ: ' + error.message);
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new CompanyCustomerManager();
});
