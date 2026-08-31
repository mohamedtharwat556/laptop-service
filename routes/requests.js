const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all requests
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/requests');
        const { data, error } = await supabase.from('requests').select('*').is('deleted_at', null).order('created_at', { ascending: false });
        if (error) throw error;

        // Convert snake_case to camelCase
        const converted = (data || []).map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            requestType: item.request_type || 'single',
            fullName: item.full_name,
            phone: item.phone,
            email: item.email,
            referralCode: item.referral_code || '',
            deviceType: item.device_type,
            laptopBrand: item.laptop_brand,
            laptopModel: item.laptop_model,
            serialNumber: item.serial_number,
            receivedDate: item.received_date,
            problemDescription: item.problem_description,
            priority: item.priority,
            status: item.status,
            cost: item.cost,
            estimatedCompletionDate: item.estimated_completion_date,
            deviceImage: item.device_image,
            repairImages: item.repair_images,
            replacementParts: item.replacement_parts,
            notes: item.notes,
            technicianNotes: item.technician_notes,
            technician: item.technician,
            adminReply: item.admin_reply,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            deletedAt: item.deleted_at
        }));

        res.json(converted);
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: error.message });
    }
});

// Soft delete request
router.put('/:id/soft-delete', async (req, res) => {
    try {
        console.log('🗑️ Soft deleting request:', req.params.id);
        const { data, error } = await supabase.from('requests').update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error soft deleting request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Restore request
router.put('/:id/restore', async (req, res) => {
    try {
        console.log('♻️ Restoring request:', req.params.id);
        const { data, error } = await supabase.from('requests').update({ deleted_at: null }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error restoring request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all trash (deleted items)
router.get('/trash', async (req, res) => {
    try {
        console.log('📋 GET /api/requests/trash');
        const { data, error } = await supabase.from('requests').select('*').not('deleted_at', 'is', null).order('deleted_at', { ascending: false });
        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Convert snake_case to camelCase
        const converted = (data || []).map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            requestType: item.request_type || 'single',
            fullName: item.full_name,
            phone: item.phone,
            email: item.email,
            referralCode: item.referral_code || '',
            deviceType: item.device_type,
            laptopBrand: item.laptop_brand,
            laptopModel: item.laptop_model,
            serialNumber: item.serial_number,
            receivedDate: item.received_date,
            problemDescription: item.problem_description,
            priority: item.priority,
            status: item.status,
            cost: item.cost,
            estimatedCompletionDate: item.estimated_completion_date,
            deviceImage: item.device_image,
            repairImages: item.repair_images,
            replacementParts: item.replacement_parts,
            notes: item.notes,
            technicianNotes: item.technician_notes,
            technician: item.technician,
            adminReply: item.admin_reply,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            deletedAt: item.deleted_at
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching trash requests:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create request
router.post('/', async (req, res) => {
    try {
        console.log('📝 POST /api/requests - Request body:', req.body);

        // Generate YAS request number
        const { data: existingRequests } = await supabase.from('requests').select('request_number').order('created_at', { ascending: false }).limit(1);
        let nextNumber = 1;
        if (existingRequests && existingRequests.length > 0) {
            const lastRequestNumber = existingRequests[0].request_number;
            // Match any prefix followed by a number (YAS, REQ, etc.)
            const match = lastRequestNumber.match(/(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        const requestNumber = `YAS ${nextNumber}`;

        const newRequest = {
            request_number: req.body.requestNumber || requestNumber,
            full_name: req.body.fullName,
            phone: req.body.phone,
            email: req.body.email || '',
            referral_code: req.body.referralCode || '',
            laptop_brand: req.body.laptopBrand,
            laptop_model: req.body.laptopModel,
            serial_number: req.body.serialNumber,
            received_date: req.body.receivedDate,
            problem_description: req.body.problemDescription,
            status: req.body.status || 'Received',
            priority: req.body.priority || 'Medium',
            cost: req.body.cost || 0,
            device_image: req.body.deviceImage || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Only add request_type if provided (for backward compatibility)
        if (req.body.requestType) {
            newRequest.request_type = req.body.requestType;
        }

        // Add optional fields if provided
        if (req.body.adminReply !== undefined) newRequest.admin_reply = req.body.adminReply;
        if (req.body.estimatedCompletionDate !== undefined) newRequest.estimated_completion_date = req.body.estimatedCompletionDate;

        console.log('📝 Inserting request to Supabase:', newRequest);
        const { data, error } = await supabase.from('requests').insert([newRequest]).select();
        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }
        console.log('✅ Request inserted successfully:', data[0]);
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('❌ POST /api/requests error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get request by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('requests').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Request not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update request
router.put('/:id', async (req, res) => {
    try {
        console.log('📝 PUT /api/requests/:id - Request body:', req.body);
        
        // Convert camelCase to snake_case for Supabase
        const snakeCaseData = {};
        const bodyKeys = Object.keys(req.body);
        
        bodyKeys.forEach(key => {
            if (key === 'adminReply') snakeCaseData.admin_reply = req.body[key];
            else if (key === 'estimatedCompletionDate') snakeCaseData.estimated_completion_date = req.body[key];
            else if (key === 'receivedDate') snakeCaseData.received_date = req.body[key];
            else if (key === 'laptopBrand') snakeCaseData.laptop_brand = req.body[key];
            else if (key === 'laptopModel') snakeCaseData.laptop_model = req.body[key];
            else if (key === 'serialNumber') snakeCaseData.serial_number = req.body[key];
            else if (key === 'problemDescription') snakeCaseData.problem_description = req.body[key];
            else if (key === 'deviceImage') snakeCaseData.device_image = req.body[key];
            else if (key === 'repairImages') snakeCaseData.repair_images = req.body[key];
            else if (key === 'replacementParts') snakeCaseData.replacement_parts = req.body[key];
            else if (key === 'technicianNotes') snakeCaseData.technician_notes = req.body[key];
            else if (key === 'technician') snakeCaseData.technician = req.body[key];
            else if (key === 'requestType') snakeCaseData.request_type = req.body[key];
            else snakeCaseData[key] = req.body[key];
        });
        
        const updateData = { ...snakeCaseData, updated_at: new Date().toISOString() };
        console.log('📝 Update data for Supabase:', updateData);

        const { data, error } = await supabase.from('requests').update(updateData).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete request
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('requests').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete all requests
router.delete('/', async (req, res) => {
    try {
        const { error } = await supabase.from('requests').delete().not('id', 'is', null);
        if (error) throw error;
        res.json({ message: 'All requests deleted successfully' });
    } catch (error) {
        console.error('Error deleting all requests:', error);
        res.status(500).json({ error: 'Failed to delete all requests' });
    }
});

// Convert request to bulk request
router.post('/:id/convert-to-bulk', async (req, res) => {
    try {
        console.log(' Converting request to bulk request:', req.params.id);

        // Get the original request
        const { data: originalRequest, error: fetchError } = await supabase
            .from('requests')
            .select('*')
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (fetchError) throw fetchError;
        if (!originalRequest) return res.status(404).json({ error: 'Request not found or already converted' });

        // Generate BULK request number
        const { data: existingBulkRequests } = await supabase
            .from('bulk_requests')
            .select('request_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNumber = 1;
        if (existingBulkRequests && existingBulkRequests.length > 0) {
            const lastRequestNumber = existingBulkRequests[0].request_number;
            const match = lastRequestNumber.match(/BULK (\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        const requestNumber = `BULK ${nextNumber}`;

        // Create bulk request
        const newBulkRequest = {
            request_number: requestNumber,
            customer_name: originalRequest.full_name,
            customer_phone: originalRequest.phone,
            customer_email: originalRequest.email || '',
            device_count: 1,
            status: originalRequest.status,
            priority: originalRequest.priority,
            cost: originalRequest.cost || 0,
            notes: originalRequest.notes || '',
            admin_reply: originalRequest.admin_reply || null,
            technician: originalRequest.technician || null,
            estimated_completion_date: originalRequest.estimated_completion_date || null,
            created_at: originalRequest.created_at,
            updated_at: new Date().toISOString()
        };

        const { data: bulkRequest, error: bulkError } = await supabase
            .from('bulk_requests')
            .insert([newBulkRequest])
            .select();

        if (bulkError) throw bulkError;

        // Create device for the bulk request
        const newDevice = {
            bulk_request_id: bulkRequest[0].id,
            device_number: 1,
            laptop_brand: originalRequest.laptop_brand,
            laptop_model: originalRequest.laptop_model,
            serial_number: originalRequest.serial_number,
            received_date: originalRequest.received_date,
            priority: originalRequest.priority,
            problem_description: originalRequest.problem_description,
            device_image: originalRequest.device_image || null,
            status: originalRequest.status,
            admin_reply: originalRequest.admin_reply || null,
            cost: originalRequest.cost || 0,
            technician: originalRequest.technician || null,
            estimated_completion_date: originalRequest.estimated_completion_date || null,
            created_at: originalRequest.created_at,
            updated_at: new Date().toISOString()
        };

        const { data: device, error: deviceError } = await supabase
            .from('bulk_request_devices')
            .insert([newDevice])
            .select();

        if (deviceError) throw deviceError;

        // Soft delete the original request
        await supabase
            .from('requests')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', req.params.id);

        res.status(201).json({
            bulkRequest: bulkRequest[0],
            device: device[0],
            message: 'Request converted to bulk request successfully'
        });
    } catch (error) {
        console.error('Error converting request to bulk request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Convert request to company request
router.post('/:id/convert-to-company', async (req, res) => {
    try {
        console.log(' Converting request to company request:', req.params.id);

        // Get the original request
        const { data: originalRequest, error: fetchError } = await supabase
            .from('requests')
            .select('*')
            .eq('id', req.params.id)
            .is('deleted_at', null)
            .single();

        if (fetchError) throw fetchError;
        if (!originalRequest) return res.status(404).json({ error: 'Request not found or already converted' });

        // Generate company request number
        const { data: existingCompanyRequests } = await supabase
            .from('company_requests')
            .select('request_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNumber = 1;
        if (existingCompanyRequests && existingCompanyRequests.length > 0) {
            const lastRequestNumber = existingCompanyRequests[0].request_number;
            const match = lastRequestNumber.match(/COMP (\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        const requestNumber = `COMP ${nextNumber}`;

        // Create company request
        const newCompanyRequest = {
            request_number: requestNumber,
            full_name: originalRequest.full_name,
            phone: originalRequest.phone,
            laptop_brand: originalRequest.laptop_brand,
            laptop_model: originalRequest.laptop_model,
            serial_number: originalRequest.serial_number,
            received_date: originalRequest.received_date,
            problem_description: originalRequest.problem_description,
            priority: originalRequest.priority,
            status: originalRequest.status,
            admin_reply: originalRequest.admin_reply || null,
            technician: originalRequest.technician || null,
            technician_notes: originalRequest.technician_notes || null,
            cost: originalRequest.cost || 0,
            estimated_completion_date: originalRequest.estimated_completion_date || null,
            created_at: originalRequest.created_at,
            updated_at: new Date().toISOString()
        };

        const { data: companyRequest, error: companyError } = await supabase
            .from('company_requests')
            .insert([newCompanyRequest])
            .select();

        if (companyError) throw companyError;

        // Soft delete the original request
        await supabase
            .from('requests')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', req.params.id);

        res.status(201).json({
            companyRequest: companyRequest[0],
            message: 'Request converted to company request successfully'
        });
    } catch (error) {
        console.error('Error converting request to company request:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
