const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all company requests
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/company-requests');
        const { data, error } = await supabase.from('company_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        // Get devices for each company request
        const companyRequestsWithDevices = await Promise.all(
            (data || []).map(async (item) => {
                const { data: devices, error: devicesError } = await supabase
                    .from('company_request_devices')
                    .select('*')
                    .eq('bulk_request_id', item.id)
                    .order('device_number', { ascending: true });
                
                if (devicesError) {
                    console.error('Error fetching devices for company request:', item.id, devicesError);
                    return { ...item, devices: [] };
                }
                
                return { ...item, devices: devices || [] };
            })
        );
        
        // Convert snake_case to camelCase
        const converted = companyRequestsWithDevices.map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            companyName: item.company_name,
            companyPhone: item.company_phone,
            companyEmail: item.company_email,
            commercialRegister: item.commercial_register,
            contactPerson: item.contact_person,
            contactPersonPhone: item.contact_person_phone,
            deviceCount: item.device_count,
            status: item.status,
            priority: item.priority,
            cost: item.cost,
            notes: item.technician_notes,
            adminReply: item.admin_reply,
            technician: item.technician,
            estimatedCompletionDate: item.estimated_completion_date,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            devices: (item.devices || []).map(device => ({
                id: device.id,
                bulkRequestId: device.bulk_request_id,
                deviceNumber: device.device_number,
                laptopBrand: device.laptop_brand,
                laptopModel: device.laptop_model,
                serialNumber: device.serial_number,
                receivedDate: device.received_date,
                problemDescription: device.problem_description,
                priority: device.priority,
                deviceImage: device.device_image,
                status: device.status,
                createdAt: device.created_at,
                updatedAt: device.updated_at
            }))
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching company requests:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get company request by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('company_requests').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Company request not found' });
        
        // Get devices for this request
        const { data: devices, error: devicesError } = await supabase
            .from('company_request_devices')
            .select('*')
            .eq('bulk_request_id', req.params.id)
            .order('device_number', { ascending: true });
        
        if (devicesError) {
            console.error('Error fetching devices:', devicesError);
            return res.json({ ...data, devices: [] });
        }
        
        res.json({ ...data, devices: devices || [] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create company request
router.post('/', async (req, res) => {
    try {
        console.log('📝 POST /api/company-requests - Request body:', req.body);

        // Generate YAS company request number
        const { data: existingRequests } = await supabase.from('company_requests').select('request_number').order('created_at', { ascending: false }).limit(1);
        let nextNumber = 1;
        if (existingRequests && existingRequests.length > 0) {
            const lastRequestNumber = existingRequests[0].request_number;
            const match = lastRequestNumber.match(/YAS-COMP (\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        const requestNumber = `YAS-COMP ${nextNumber}`;

        const devices = req.body.devices || [];
        const deviceCount = devices.length;

        const newRequest = {
            request_number: req.body.requestNumber || requestNumber,
            company_name: req.body.companyName,
            company_phone: req.body.companyPhone,
            company_email: req.body.companyEmail || '',
            commercial_register: req.body.commercialRegister || '',
            contact_person: req.body.contactPerson || '',
            contact_person_phone: req.body.contactPersonPhone || '',
            device_count: deviceCount,
            status: req.body.status || 'Received',
            priority: req.body.priority || 'Medium',
            cost: req.body.cost || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Add optional fields if provided
        if (req.body.adminReply !== undefined) newRequest.admin_reply = req.body.adminReply;
        if (req.body.estimatedCompletionDate !== undefined) newRequest.estimated_completion_date = req.body.estimatedCompletionDate;
        if (req.body.technician !== undefined) newRequest.technician = req.body.technician;
        if (req.body.technicianNotes !== undefined) newRequest.technician_notes = req.body.technicianNotes;

        console.log('📝 Inserting company request to Supabase:', newRequest);
        const { data, error } = await supabase.from('company_requests').insert([newRequest]).select();
        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        console.log('✅ Company request inserted successfully:', data[0]);

        // Insert devices
        if (devices.length > 0) {
            const devicesToInsert = devices.map((device, index) => ({
                bulk_request_id: data[0].id,
                device_number: index + 1,
                laptop_brand: device.laptopBrand,
                laptop_model: device.laptopModel,
                serial_number: device.serialNumber,
                received_date: device.receivedDate,
                problem_description: device.problemDescription,
                priority: device.priority || 'Medium',
                device_image: device.deviceImage || null,
                status: 'Received',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error: devicesError } = await supabase.from('company_request_devices').insert(devicesToInsert);
            if (devicesError) {
                console.error('❌ Error inserting devices:', devicesError);
                // Don't throw error, just log it
            }
        }

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('❌ POST /api/company-requests error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update company request
router.put('/:id', async (req, res) => {
    try {
        console.log('📝 PUT /api/company-requests/:id - Request body:', req.body);
        
        // Convert camelCase to snake_case for Supabase
        const snakeCaseData = {};
        const bodyKeys = Object.keys(req.body);
        
        bodyKeys.forEach(key => {
            if (key === 'companyName') snakeCaseData.company_name = req.body[key];
            else if (key === 'companyPhone') snakeCaseData.company_phone = req.body[key];
            else if (key === 'companyEmail') snakeCaseData.company_email = req.body[key];
            else if (key === 'commercialRegister') snakeCaseData.commercial_register = req.body[key];
            else if (key === 'contactPerson') snakeCaseData.contact_person = req.body[key];
            else if (key === 'contactPersonPhone') snakeCaseData.contact_person_phone = req.body[key];
            else if (key === 'laptopBrand') snakeCaseData.laptop_brand = req.body[key];
            else if (key === 'laptopModel') snakeCaseData.laptop_model = req.body[key];
            else if (key === 'serialNumber') snakeCaseData.serial_number = req.body[key];
            else if (key === 'receivedDate') snakeCaseData.received_date = req.body[key];
            else if (key === 'problemDescription') snakeCaseData.problem_description = req.body[key];
            else if (key === 'deviceImage') snakeCaseData.device_image = req.body[key];
            else if (key === 'technicianNotes') snakeCaseData.technician_notes = req.body[key];
            else if (key === 'technician') snakeCaseData.technician = req.body[key];
            else if (key === 'adminReply') snakeCaseData.admin_reply = req.body[key];
            else if (key === 'estimatedCompletionDate') snakeCaseData.estimated_completion_date = req.body[key];
            else if (key === 'rating') snakeCaseData.rating = req.body[key];
            else if (key === 'ratingComment') snakeCaseData.rating_comment = req.body[key];
            else snakeCaseData[key] = req.body[key];
        });
        
        const updateData = { ...snakeCaseData, updated_at: new Date().toISOString() };
        console.log('📝 Update data for Supabase:', updateData);
        
        const { data, error } = await supabase.from('company_requests').update(updateData).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Company request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error updating company request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete company request
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('company_requests').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete all company requests
router.delete('/', async (req, res) => {
    try {
        console.log('🗑️ Deleting all company requests');
        const { error } = await supabase.from('company_requests').delete().neq('id', 0);
        if (error) throw error;
        res.json({ success: true, message: 'All company requests deleted' });
    } catch (error) {
        console.error('Error deleting all company requests:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
