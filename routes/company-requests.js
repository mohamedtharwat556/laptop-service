const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all company requests
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/company-requests');
        const { data, error } = await supabase
            .from('company_requests')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert to camelCase
        const camelCaseData = data.map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            fullName: item.full_name,
            phone: item.phone,
            laptopBrand: item.laptop_brand,
            laptopModel: item.laptop_model,
            serialNumber: item.serial_number,
            receivedDate: item.received_date,
            problemDescription: item.problem_description,
            priority: item.priority,
            status: item.status,
            adminReply: item.admin_reply,
            technician: item.technician,
            technicianNotes: item.technician_notes,
            cost: item.cost,
            estimatedCompletionDate: item.estimated_completion_date,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            deletedAt: item.deleted_at
        }));

        res.json(camelCaseData);
    } catch (error) {
        console.error('Error fetching company requests:', error);
        res.status(500).json({ error: 'Failed to fetch company requests' });
    }
});

// Soft delete company request
router.put('/:id/soft-delete', async (req, res) => {
    try {
        console.log('🗑️ Soft deleting company request:', req.params.id);
        const { data, error } = await supabase.from('company_requests').update({ deleted_at: new Date().toISOString() }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Company request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error soft deleting company request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Restore company request
router.put('/:id/restore', async (req, res) => {
    try {
        console.log('♻️ Restoring company request:', req.params.id);
        const { data, error } = await supabase.from('company_requests').update({ deleted_at: null }).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Company request not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error restoring company request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all trash (deleted items)
router.get('/trash', async (req, res) => {
    try {
        console.log('📋 GET /api/company-requests/trash');
        const { data, error } = await supabase
            .from('company_requests')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Convert to camelCase
        const camelCaseData = data.map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            fullName: item.full_name,
            phone: item.phone,
            laptopBrand: item.laptop_brand,
            laptopModel: item.laptop_model,
            serialNumber: item.serial_number,
            receivedDate: item.received_date,
            problemDescription: item.problem_description,
            priority: item.priority,
            status: item.status,
            adminReply: item.admin_reply,
            technician: item.technician,
            technicianNotes: item.technician_notes,
            cost: item.cost,
            estimatedCompletionDate: item.estimated_completion_date,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            deletedAt: item.deleted_at
        }));

        res.json(camelCaseData);
    } catch (error) {
        console.error('Error fetching trash company requests:', error);
        res.status(500).json({ error: 'Failed to fetch trash company requests' });
    }
});

// Get company request by ID
router.get('/:id', async (req, res) => {
    try {
        console.log('📋 GET /api/company-requests/:id', req.params.id);
        const { data, error } = await supabase
            .from('company_requests')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Company request not found' });

        // Convert to camelCase
        const camelCaseData = {
            id: data.id,
            requestNumber: data.request_number,
            fullName: data.full_name,
            phone: data.phone,
            laptopBrand: data.laptop_brand,
            laptopModel: data.laptop_model,
            serialNumber: data.serial_number,
            receivedDate: data.received_date,
            problemDescription: data.problem_description,
            priority: data.priority,
            status: data.status,
            adminReply: data.admin_reply,
            technician: data.technician,
            technicianNotes: data.technician_notes,
            cost: data.cost,
            estimatedCompletionDate: data.estimated_completion_date,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            deletedAt: data.deleted_at
        };

        res.json(camelCaseData);
    } catch (error) {
        console.error('Error fetching company request:', error);
        res.status(500).json({ error: 'Failed to fetch company request' });
    }
});

// POST /api/company-requests - Create a new company request
router.post('/', async (req, res) => {
    try {
        // Generate request number
        const { data: existingRequests } = await supabase
            .from('company_requests')
            .select('request_number')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNumber = 1;
        if (existingRequests && existingRequests.length > 0) {
            const lastRequestNumber = existingRequests[0].request_number;
            const match = lastRequestNumber.match(/YAS-COMP (\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const requestNumber = `YAS-COMP ${nextNumber}`;

        const newRequest = {
            request_number: req.body.requestNumber || requestNumber,
            full_name: req.body.fullName,
            phone: req.body.phone,
            laptop_brand: req.body.laptopBrand,
            laptop_model: req.body.laptopModel,
            serial_number: req.body.serialNumber || null,
            received_date: req.body.receivedDate,
            problem_description: req.body.problemDescription,
            priority: req.body.priority || 'Medium',
            status: 'Received'
        };

        const { data, error } = await supabase
            .from('company_requests')
            .insert([newRequest])
            .select()
            .single();

        if (error) throw error;

        // Convert to camelCase
        const camelCaseData = {
            id: data.id,
            requestNumber: data.request_number,
            fullName: data.full_name,
            phone: data.phone,
            laptopBrand: data.laptop_brand,
            laptopModel: data.laptop_model,
            serialNumber: data.serial_number,
            receivedDate: data.received_date,
            problemDescription: data.problem_description,
            priority: data.priority,
            status: data.status,
            adminReply: data.admin_reply,
            technician: data.technician,
            technicianNotes: data.technician_notes,
            cost: data.cost,
            estimatedCompletionDate: data.estimated_completion_date,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.status(201).json(camelCaseData);
    } catch (error) {
        console.error('Error creating company request:', error);
        res.status(500).json({ error: 'Failed to create company request' });
    }
});

// PUT /api/company-requests/:id - Update a company request
router.put('/:id', async (req, res) => {
    try {
        console.log('📝 PUT /api/company-requests/:id', req.params.id);
        console.log('📝 Request body:', req.body);

        const updateData = {
            full_name: req.body.full_name || req.body.fullName,
            phone: req.body.phone,
            laptop_brand: req.body.laptop_brand || req.body.laptopBrand,
            laptop_model: req.body.laptop_model || req.body.laptopModel,
            serial_number: req.body.serial_number || req.body.serialNumber,
            received_date: req.body.received_date || req.body.receivedDate,
            problem_description: req.body.problem_description || req.body.problemDescription,
            priority: req.body.priority,
            admin_reply: req.body.admin_reply || req.body.adminReply,
            cost: req.body.cost,
            technician: req.body.technician,
            estimated_completion_date: req.body.estimated_completion_date || req.body.estimatedCompletionDate,
            status: req.body.status,
            technician_notes: req.body.technician_notes || req.body.technicianNotes
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            }
        });

        console.log('📝 Update data:', updateData);

        const { data, error } = await supabase
            .from('company_requests')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        if (!data) {
            return res.status(404).json({ error: 'Company request not found' });
        }

        // Convert to camelCase
        const camelCaseData = {
            id: data.id,
            requestNumber: data.request_number,
            fullName: data.full_name,
            phone: data.phone,
            laptopBrand: data.laptop_brand,
            laptopModel: data.laptop_model,
            serialNumber: data.serial_number,
            receivedDate: data.received_date,
            problemDescription: data.problem_description,
            priority: data.priority,
            status: data.status,
            adminReply: data.admin_reply,
            technician: data.technician,
            technicianNotes: data.technician_notes,
            cost: data.cost,
            estimatedCompletionDate: data.estimated_completion_date,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };

        res.json(camelCaseData);
    } catch (error) {
        console.error('❌ Error updating company request:', error);
        res.status(500).json({ error: error.message || 'Failed to update company request' });
    }
});

// DELETE /api/company-requests/:id - Delete a company request
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('company_requests')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Company request deleted successfully' });
    } catch (error) {
        console.error('Error deleting company request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Convert company request to bulk request
router.post('/:id/convert-to-bulk', async (req, res) => {
    try {
        console.log('🔄 Converting company request to bulk request:', req.params.id);

        // Get the original company request
        const { data: originalRequest, error: fetchError } = await supabase
            .from('company_requests')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;
        if (!originalRequest) return res.status(404).json({ error: 'Company request not found' });

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
            customer_email: '',
            device_count: 1,
            status: originalRequest.status,
            priority: originalRequest.priority,
            cost: originalRequest.cost || 0,
            notes: originalRequest.technician_notes || '',
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
            device_image: null,
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

        // Soft delete the original company request
        await supabase
            .from('company_requests')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', req.params.id);

        res.status(201).json({
            bulkRequest: bulkRequest[0],
            device: device[0],
            message: 'Company request converted to bulk request successfully'
        });
    } catch (error) {
        console.error('Error converting company request to bulk request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Convert company request to single request
router.post('/:id/convert-to-single', async (req, res) => {
    try {
        console.log('Converting company request to single request:', req.params.id);

        const { data: originalRequest, error: fetchError } = await supabase
            .from('company_requests')
            .select('*')
            .eq('id', req.params.id)
            .single();

        console.log('Original request:', originalRequest);
        console.log('Fetch error:', fetchError);

        if (fetchError) throw fetchError;
        if (!originalRequest) return res.status(404).json({ error: 'Company request not found' });

        const { data: existingRequests } = await supabase
            .from('requests')
            .select('request_number')
            .order('created_at', { ascending: false })
            .limit(1);

        console.log('Existing requests:', existingRequests);

        let nextNumber = 1;
        if (existingRequests && existingRequests.length > 0) {
            const lastRequestNumber = existingRequests[0].request_number;
            const match = lastRequestNumber.match(/REQ (\d+)/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }
        const requestNumber = `REQ ${nextNumber}`;

        console.log('Request number:', requestNumber);

        const newRequest = {
            request_number: requestNumber,
            full_name: originalRequest.full_name,
            phone: originalRequest.phone,
            email: '',
            device_type: 'laptop',
            laptop_brand: originalRequest.laptop_brand,
            laptop_model: originalRequest.laptop_model,
            problem_description: originalRequest.problem_description,
            priority: originalRequest.priority,
            status: originalRequest.status,
            cost: originalRequest.cost || 0,
            device_image: null,
            notes: originalRequest.technician_notes || null,
            technician_notes: originalRequest.technician_notes || null,
            estimated_completion_date: originalRequest.estimated_completion_date || null,
            created_at: originalRequest.created_at,
            updated_at: new Date().toISOString()
        };

        console.log('New request to insert:', newRequest);

        const { data: request, error: requestError } = await supabase
            .from('requests')
            .insert([newRequest])
            .select();

        console.log('Insert result:', request);
        console.log('Insert error:', requestError);

        if (requestError) throw requestError;

        await supabase
            .from('company_requests')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', req.params.id);

        res.status(201).json({
            request: request[0],
            message: 'Company request converted to single request successfully'
        });
    } catch (error) {
        console.error('Error converting company request to single request:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
