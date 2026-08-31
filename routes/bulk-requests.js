const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all bulk requests with devices
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/bulk-requests');
        const { data, error } = await supabase.from('bulk_requests').select('*').is('deleted_at', null).order('created_at', { ascending: false });
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
            deletedAt: item.deleted_at,
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
                adminReply: device.admin_reply,
                cost: device.cost,
                technician: device.technician,
                estimatedCompletionDate: device.estimated_completion_date,
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

// Soft delete bulk request
router.put('/:id/soft-delete', async (req, res) => {
    try {
        console.log('🗑️ Soft deleting bulk request:', req.params.id);
        const { data, error } = await supabase.from('bulk_requests').update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Bulk request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error soft deleting bulk request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Restore bulk request
router.put('/:id/restore', async (req, res) => {
    try {
        console.log('♻️ Restoring bulk request:', req.params.id);
        const { data, error } = await supabase.from('bulk_requests').update({ deleted_at: null }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Bulk request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error restoring bulk request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all trash (deleted items)
router.get('/trash', async (req, res) => {
    try {
        console.log('📋 GET /api/bulk-requests/trash');
        const { data, error } = await supabase.from('bulk_requests').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
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
            deletedAt: item.deleted_at,
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
                adminReply: device.admin_reply,
                cost: device.cost,
                technician: device.technician,
                estimatedCompletionDate: device.estimated_completion_date,
                createdAt: device.created_at,
                updatedAt: device.updated_at
            }))
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching trash bulk requests:', error);
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
            adminReply: bulkRequest.admin_reply,
            technician: bulkRequest.technician,
            estimatedCompletionDate: bulkRequest.estimated_completion_date,
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
                adminReply: device.admin_reply,
                cost: device.cost,
                technician: device.technician,
                estimatedCompletionDate: device.estimated_completion_date,
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
                admin_reply: device.adminReply || null,
                cost: device.cost || 0,
                technician: device.technician || null,
                estimated_completion_date: device.estimatedCompletionDate || null,
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

// Add device to existing bulk request
router.post('/:id/devices', async (req, res) => {
    try {
        console.log('📝 POST /api/bulk-requests/:id/devices - Adding device to bulk request:', req.params.id);
        console.log('📝 Request body:', req.body);

        // Get current bulk request to check if it exists
        const { data: bulkRequest, error: bulkError } = await supabase
            .from('bulk_requests')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (bulkError) throw bulkError;
        if (!bulkRequest) return res.status(404).json({ error: 'Bulk request not found' });

        // Get current devices to determine next device number
        const { data: existingDevices, error: devicesError } = await supabase
            .from('bulk_request_devices')
            .select('device_number')
            .eq('bulk_request_id', req.params.id)
            .order('device_number', { ascending: false })
            .limit(1);

        if (devicesError) throw devicesError;

        const nextDeviceNumber = existingDevices && existingDevices.length > 0
            ? existingDevices[0].device_number + 1
            : 1;

        // Insert new device
        const newDevice = {
            bulk_request_id: req.params.id,
            device_number: nextDeviceNumber,
            laptop_brand: req.body.laptopBrand,
            laptop_model: req.body.laptopModel,
            serial_number: req.body.serialNumber || null,
            received_date: req.body.receivedDate || new Date().toISOString(),
            priority: req.body.priority || 'Medium',
            problem_description: req.body.problemDescription || '',
            device_image: req.body.deviceImage || null,
            status: req.body.status || 'Received',
            admin_reply: null,
            cost: req.body.cost || 0,
            technician: null,
            estimated_completion_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: deviceData, error: deviceError } = await supabase
            .from('bulk_request_devices')
            .insert([newDevice])
            .select();

        if (deviceError) throw deviceError;

        // Update device_count in bulk_requests
        const { data: updatedBulkRequest, error: updateError } = await supabase
            .from('bulk_requests')
            .update({
                device_count: bulkRequest.device_count + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select();

        if (updateError) throw updateError;

        // Convert to camelCase
        const convertedDevice = {
            id: deviceData[0].id,
            bulkRequestId: deviceData[0].bulk_request_id,
            deviceNumber: deviceData[0].device_number,
            laptopBrand: deviceData[0].laptop_brand,
            laptopModel: deviceData[0].laptop_model,
            serialNumber: deviceData[0].serial_number,
            receivedDate: deviceData[0].received_date,
            priority: deviceData[0].priority,
            problemDescription: deviceData[0].problem_description,
            deviceImage: deviceData[0].device_image,
            status: deviceData[0].status,
            adminReply: deviceData[0].admin_reply,
            cost: deviceData[0].cost,
            technician: deviceData[0].technician,
            estimatedCompletionDate: deviceData[0].estimated_completion_date,
            createdAt: deviceData[0].created_at,
            updatedAt: deviceData[0].updated_at
        };

        res.status(201).json({
            device: convertedDevice,
            bulkRequest: {
                ...updatedBulkRequest[0],
                deviceCount: updatedBulkRequest[0].device_count
            }
        });
    } catch (error) {
        console.error('❌ Error adding device to bulk request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update bulk request device status and fields
router.put('/devices/:id', async (req, res) => {
    try {
        console.log('📝 PUT /api/bulk-requests/devices/:id - Request body:', req.body);
        
        // Convert camelCase to snake_case for Supabase
        const snakeCaseData = {};
        const bodyKeys = Object.keys(req.body);
        
        bodyKeys.forEach(key => {
            const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            snakeCaseData[snakeKey] = req.body[key];
        });
        
        const { data, error } = await supabase.from('bulk_request_devices')
            .update({ 
                ...snakeCaseData,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Device not found' });
        
        // Convert back to camelCase
        const converted = {
            id: data[0].id,
            bulkRequestId: data[0].bulk_request_id,
            deviceNumber: data[0].device_number,
            laptopBrand: data[0].laptop_brand,
            laptopModel: data[0].laptop_model,
            serialNumber: data[0].serial_number,
            receivedDate: data[0].received_date,
            priority: data[0].priority,
            problemDescription: data[0].problem_description,
            deviceImage: data[0].device_image,
            status: data[0].status,
            adminReply: data[0].admin_reply,
            cost: data[0].cost,
            technician: data[0].technician,
            estimatedCompletionDate: data[0].estimated_completion_date,
            createdAt: data[0].created_at,
            updatedAt: data[0].updated_at
        };
        
        res.json(converted);
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update bulk request
router.put('/:id', async (req, res) => {
    try {
        console.log('📝 PUT /api/bulk-requests/:id - Request body:', req.body);
        console.log('📝 customerPhone value:', req.body.customerPhone);
        
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
        console.log('📝 customer_phone in updateData:', updateData.customer_phone);
        
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

// Convert bulk request to single request
router.post('/:id/convert-to-single', async (req, res) => {
    try {
        console.log('🔄 Converting bulk request to single request:', req.params.id);

        const { data: bulkRequest } = await supabase
            .from('bulk_requests')
            .select('*')
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (!bulkRequest) {
            return res.status(404).json({ error: 'Bulk request not found or already converted' });
        }

        const { data: devices } = await supabase
            .from('bulk_request_devices')
            .select('*')
            .eq('bulk_request_id', req.params.id)
            .is('deleted_at', null)
            .order('device_number', { ascending: true })
            .limit(1);

        if (!devices || devices.length === 0) {
            return res.status(400).json({ error: 'لا يمكن تحويل طلب جملة بدون أجهزة. أضف أجهزة أولاً.' });
        }

        const firstDevice = devices[0];

        const { data: existingRequests } = await supabase
            .from('requests')
            .select('request_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNumber = 1;
        if (existingRequests && existingRequests.length > 0) {
            const match = existingRequests[0].request_number?.match(/YAS (\d+)/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        const { data: request } = await supabase
            .from('requests')
            .insert([{
                request_number: `YAS ${nextNumber}`,
                full_name: bulkRequest.customer_name,
                phone: bulkRequest.customer_phone,
                laptop_brand: firstDevice.laptop_brand,
                laptop_model: firstDevice.laptop_model,
                problem_description: firstDevice.problem_description,
                priority: firstDevice.priority,
                status: firstDevice.status,
                cost: firstDevice.cost || 0,
                created_at: bulkRequest.created_at
            }])
            .select();

        await supabase.from('bulk_request_devices').update({ deleted_at: new Date().toISOString() }).eq('bulk_request_id', req.params.id);
        await supabase.from('bulk_requests').update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);

        res.json({ request: request[0] });
    } catch (error) {
        console.error('Error converting bulk request to single:', error);
        res.status(500).json({ error: error.message });
    }
});

// Convert bulk request to company request
router.post('/:id/convert-to-company', async (req, res) => {
    try {
        console.log('🔄 Converting bulk request to company request:', req.params.id);

        const { data: bulkRequest } = await supabase
            .from('bulk_requests')
            .select('*')
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (!bulkRequest) {
            return res.status(404).json({ error: 'Bulk request not found or already converted' });
        }

        const { data: devices } = await supabase
            .from('bulk_request_devices')
            .select('*')
            .eq('bulk_request_id', req.params.id)
            .is('deleted_at', null)
            .order('device_number', { ascending: true })
            .limit(1);

        if (!devices || devices.length === 0) {
            return res.status(400).json({ error: 'لا يمكن تحويل طلب جملة بدون أجهزة. أضف أجهزة أولاً.' });
        }

        const firstDevice = devices[0];

        const { data: existingCompanyRequests } = await supabase
            .from('company_requests')
            .select('request_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNumber = 1;
        if (existingCompanyRequests && existingCompanyRequests.length > 0) {
            const match = existingCompanyRequests[0].request_number?.match(/COMP (\d+)/);
            if (match) nextNumber = parseInt(match[1]) + 1;
        }

        const { data: companyRequest } = await supabase
            .from('company_requests')
            .insert([{
                request_number: `COMP ${nextNumber}`,
                full_name: bulkRequest.customer_name,
                phone: bulkRequest.customer_phone,
                laptop_brand: firstDevice.laptop_brand,
                laptop_model: firstDevice.laptop_model,
                serial_number: firstDevice.serial_number,
                received_date: firstDevice.received_date,
                problem_description: firstDevice.problem_description,
                priority: firstDevice.priority,
                status: firstDevice.status,
                cost: firstDevice.cost || 0,
                created_at: bulkRequest.created_at
            }])
            .select();

        await supabase.from('bulk_request_devices').update({ deleted_at: new Date().toISOString() }).eq('bulk_request_id', req.params.id);
        await supabase.from('bulk_requests').update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id);

        res.json({ companyRequest: companyRequest[0] });
    } catch (error) {
        console.error('Error converting bulk request to company:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
