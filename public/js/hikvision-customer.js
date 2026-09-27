/**
 * YAS Laptop Service Center - Hikvision Customer Module
 * Handles Hikvision maintenance requests
 */

class HikvisionCustomerManager {
    constructor() {
        this.currentRequest = null;
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.renderRequestForm();
    }

    /**
     * Submit a Hikvision maintenance request
     */
    async submitRequest(formData) {
        console.log('📝 Submitting Hikvision request with data:', formData);

        // Get logged-in Hikvision admin from localStorage
        const loggedInHikvision = localStorage.getItem('loggedInHikvision');
        let hikvisionName = null;
        if (loggedInHikvision) {
            const hikvision = JSON.parse(loggedInHikvision);
            hikvisionName = hikvision.name;
        }

        const requestData = {
            requestNumber: formData.requestNumber,
            fullName: formData.fullName,
            phone: formData.phone,
            email: '',
            recordedBy: hikvisionName,
            requestType: 'hikvision',
            laptopBrand: formData.laptopBrand,
            laptopModel: formData.laptopModel,
            serialNumber: formData.serialNumber,
            receivedDate: formData.receivedDate,
            problemDescription: formData.problemDescription,
            priority: 'Medium',
            deviceImage: ''
        };

        console.log('📤 Request data to send:', requestData);

        const response = await fetch('/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to submit request');
        }

        const responseData = await response.json();
        console.log('📥 Response data:', responseData);

        this.currentRequest = responseData;
        return responseData;
    }

    /**
     * Render request form
     */
    renderRequestForm() {
        const form = document.getElementById('requestForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
        });
    }

    /**
     * Submit form (called from button)
     */
    async submitForm() {
        const form = document.getElementById('requestForm');
        if (!form) return;

        const laptopBrandSelect = form.querySelector('[name="laptopBrand"]');
        const laptopBrandOther = form.querySelector('[name="laptopBrandOther"]');
        const laptopModelSelect = form.querySelector('[name="laptopModel"]');
        const laptopModelOther = form.querySelector('[name="laptopModelOther"]');

        const formData = {
            fullName: form.querySelector('[name="fullName"]').value,
            phone: form.querySelector('[name="phone"]').value,
            laptopBrand: laptopBrandSelect.value === 'Other' ? laptopBrandOther.value : laptopBrandSelect.value,
            laptopModel: laptopModelSelect.value === 'Other' ? laptopModelOther.value : laptopModelSelect.value,
            serialNumber: form.querySelector('[name="serialNumber"]').value,
            receivedDate: form.querySelector('[name="receivedDate"]').value,
            problemDescription: form.querySelector('[name="problemDescription"]').value
        };

        try {
            const responseData = await this.submitRequest(formData);

            // Show success message
            alert('تم تقديم طلب Hikvision بنجاح!\nرقم الطلب: ' + responseData.requestNumber);

            // Clear form
            form.reset();

            // Reset date to today
            const receivedDate = document.getElementById('receivedDate');
            if (receivedDate) {
                receivedDate.value = new Date().toISOString().slice(0, 10);
            }

        } catch (error) {
            console.error('Error submitting Hikvision request:', error);
            alert('فشل تقديم الطلب: ' + error.message);
        }
    }
}

// Initialize
const hikvisionCustomerManager = new HikvisionCustomerManager();
