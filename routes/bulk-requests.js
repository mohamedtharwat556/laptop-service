const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all bulk requests with devices
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/bulk-requests');
        const { data, error } = await supabase.from('bulk_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        // Get devices for each bulk request
        const bulkRequestsWithDevices = await Promise.all(
            (data || []).map(async (item) => {
                const { data: devices, error: devicesError } = await supabase
                    .from('bulk_request_devices')
                    .select('*')
                    .eq('bulk_request_id', item.id)
                    .order('device_number', { ascending: true });
                
                if (devicesError) {
                    console.error('Error fetching devices for bulk request:', item.id, devicesError);
                    return { ...item, devices: [] };
                }
                
                return { ...item, devices: devices || [] };
            })
        );
        
        // Convert snake_case to camelCase
        const converted = bulkRequestsWithDevices.map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            customerName: item.customer_name,
            customerPhone: item.customer_phone,
            customerEmail: item.customer_email,
            deviceCount: item.device_count,
            status: item.status,
            priority: item.priority,
            cost: item.cost,
            notes: item.notes,
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
                priority: device.priority,
                problemDescription: device.problem_description,
                deviceImage: device.device_image,
                status: device.status,
                createdAt: device.created_at,
                updatedAt: device.updated_at
            }))
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching bulk requests:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get bulk request by ID with devices
router.get('/:id', async (req, res) => {
    try {
        const { data: bulkRequest, error } = await supabase.from('bulk_requests').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!bulkRequest) return res.status(404).json({ error: 'Bulk request not found' });

        // Get devices for this bulk request
        const { data: devices, error: devicesError } = await supabase.from('bulk_request_devices').select('*').eq('bulk_request_id', req.params.id).order('device_number', { ascending: true });
        if (devicesError) throw devicesError;

        // Convert to camelCase
        const convertedBulkRequest = {
            id: bulkRequest.id,
            requestNumber: bulkRequest.request_number,
            customerName: bulkRequest.customer_name,
            customerPhone: bulkRequest.customer_phone,
            customerEmail: bulkRequest.customer_email,
            deviceCount: bulkRequest.device_count,
            status: bulkRequest.status,
            priority: bulkRequest.priority,
            cost: bulkRequest.cost,
            notes: bulkRequest.notes,
            createdAt: bulkRequest.created_at,
            updatedAt: bulkRequest.updated_at,
            devices: (devices || []).map(device => ({
                id: device.id,
                deviceNumber: device.device_number,
                laptopBrand: device.laptop_brand,
                laptopModel: device.laptop_model,
                serialNumber: device.serial_number,
                receivedDate: device.received_date,
                priority: device.priority,
                problemDescription: device.problem_description,
                deviceImage: device.device_image,
                status: device.status,
                createdAt: device.created_at,
                updatedAt: device.updated_at
            }))
        };

        res.json(convertedBulkRequest);
    } catch (error) {
        console.error('Error fetching bulk request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create bulk request
router.post('/', async (req, res) => {
    try {
        console.log('📝 POST /api/bulk-requests - Request body:', req.body);

        // Generate YAS bulk request number
        const { data: existingRequests } = await supabase.from('bulk_requests').select('request_number').order('created_at', { ascending: false }).limit(1);
        let nextNumber = 1;
        if (existingRequests && existingRequests.length > 0) {
            const lastRequestNumber = existingRequests[0].request_number;
            const match = lastRequestNumber.match(/BULK (\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        const requestNumber = `BULK ${nextNumber}`;

        const newBulkRequest = {
            request_number: requestNumber,
            customer_name: req.body.customerName,
            customer_phone: req.body.customerPhone,
            customer_email: req.body.customerEmail || '',
            device_count: req.body.deviceCount,
            status: req.body.status || 'Received',
            priority: req.body.priority || 'Medium',
            cost: req.body.cost || 0,
            notes: req.body.notes || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('📝 Inserting bulk request to Supabase:', newBulkRequest);
        const { data: bulkRequest, error } = await supabase.from('bulk_requests').insert([newBulkRequest]).select();
        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        console.log('✅ Bulk request inserted successfully:', bulkRequest[0]);

        // Insert devices
        const devices = req.body.devices || [];
        const insertedDevices = [];
        
        for (let i = 0; i < devices.length; i++) {
            const device = devices[i];
            const newDevice = {
                bulk_request_id: bulkRequest[0].id,
                device_number: i + 1,
                laptop_brand: device.laptopBrand,
                laptop_model: device.laptopModel,
                serial_number: device.serialNumber,
                received_date: device.receivedDate,
                priority: device.priority,
                problem_description: device.problemDescription,
                device_image: device.deviceImage || null,
                status: device.status || 'Received',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: deviceData, error: deviceError } = await supabase.from('bulk_request_devices').insert([newDevice]).select();
            if (deviceError) {
                console.error('❌ Error inserting device:', deviceError);
                throw deviceError;
            }
            insertedDevices.push(deviceData[0]);
        }

        const response = {
            ...bulkRequest[0],
            devices: insertedDevices
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('❌ POST /api/bulk-requests error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update bulk request
router.put('/:id', async (req, res) => {
    try {
        console.log('📝 PUT /api/bulk-requests/:id - Request body:', req.body);
        
        // Convert camelCase to snake_case for Supabase
        const snakeCaseData = {};
        const bodyKeys = Object.keys(req.body);
        
        bodyKeys.forEach(key => {
            if (key === 'customerName') snakeCaseData.customer_name = req.body[key];
            else if (key === 'customerPhone') snakeCaseData.customer_phone = req.body[key];
            else if (key === 'customerEmail') snakeCaseData.customer_email = req.body[key];
            else if (key === 'deviceCount') snakeCaseData.device_count = req.body[key];
            else if (key === 'adminReply') snakeCaseData.admin_reply = req.body[key];
            else if (key === 'technician') snakeCaseData.technician = req.body[key];
            else if (key === 'estimatedCompletionDate') snakeCaseData.estimated_completion_date = req.body[key];
            else if (key === 'cost') snakeCaseData.cost = req.body[key];
            else snakeCaseData[key] = req.body[key];
        });
        
        const updateData = { ...snakeCaseData, updated_at: new Date().toISOString() };
        console.log('📝 Update data for Supabase:', updateData);
        
        const { data, error } = await supabase.from('bulk_requests').update(updateData).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Bulk request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error updating bulk request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete bulk request
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('bulk_requests').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete all bulk requests
router.delete('/', async (req, res) => {
    try {
        // First delete all devices from bulk_request_devices
        const { error: devicesError } = await supabase.from('bulk_request_devices').delete().not('bulk_request_id', 'is', null);
        if (devicesError) {
            console.error('Error deleting bulk request devices:', devicesError);
            // Continue anyway to try deleting the main requests
        }

        // Then delete all bulk requests
        const { error } = await supabase.from('bulk_requests').delete().not('id', 'is', null);
        if (error) throw error;
        
        res.json({ message: 'All bulk requests deleted successfully' });
    } catch (error) {
        console.error('Error deleting all bulk requests:', error);
        res.status(500).json({ error: 'Failed to delete all bulk requests' });
    }
});

module.exports = router;
