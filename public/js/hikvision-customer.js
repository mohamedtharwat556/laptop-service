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
            recordedBy: hikvisionName,
            requestType: 'hikvision',
            laptopBrand: formData.laptopBrand,
            laptopModel: formData.laptopModel,
            serialNumber: formData.serialNumber,
            receivedDate: formData.receivedDate,
            problemDescription: formData.problemDescription,
            priority: formData.priority || 'Medium',
            deviceImage: deviceImage
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

        const formData = {
            fullName: form.querySelector('[name="fullName"]').value,
            phone: form.querySelector('[name="phone"]').value,
            email: form.querySelector('[name="email"]') ? form.querySelector('[name="email"]').value : '',
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
