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

        // Handle request type selection
        const requestTypeSelect = document.getElementById('requestTypeSelect');
        if (requestTypeSelect) {
            requestTypeSelect.addEventListener('change', (e) => {
                const requestType = e.target.value;
                if (requestType === 'single') {
                    window.location.href = 'customer.html';
                } else if (requestType === 'bulk') {
                    window.location.href = 'bulk-customer.html';
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const laptopBrand = formData.get('laptopBrand');
            const laptopBrandOther = formData.get('laptopBrandOther');
            const finalLaptopBrand = laptopBrand === 'Other' ? laptopBrandOther : laptopBrand;

            // Handle estimated completion date
            const estimatedCompletionDateValue = formData.get('estimatedCompletionDate');
            let estimatedCompletionDate = null;
            if (estimatedCompletionDateValue) {
                const dateObj = new Date(estimatedCompletionDateValue);
                if (!isNaN(dateObj.getTime())) {
                    estimatedCompletionDate = dateObj.toISOString();
                }
            }

            const requestData = {
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                laptopBrand: finalLaptopBrand,
                laptopModel: formData.get('laptopModel'),
                serialNumber: formData.get('serialNumber'),
                receivedDate: formData.get('receivedDate'),
                problemDescription: formData.get('problemDescription'),
                priority: formData.get('priority'),
                deviceImage: null,
                estimatedCompletionDate: estimatedCompletionDate
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

                // Redirect to WhatsApp group
                const waUrl = 'https://chat.whatsapp.com/HGDzy1q5sCu3eDrqxvvzQO';
                window.open(waUrl, '_blank');

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
