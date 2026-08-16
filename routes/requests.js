const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all requests
router.get('/', async (req, res) => {
    try {
        console.log('📋 GET /api/requests');
        const { data, error } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        // Convert snake_case to camelCase
        const converted = (data || []).map(item => ({
            id: item.id,
            requestNumber: item.request_number,
            fullName: item.full_name,
            phone: item.phone,
            email: item.email,
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
            adminReply: item.admin_reply,
            createdAt: item.created_at,
            updatedAt: item.updated_at
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching requests:', error);
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

// Create request
router.post('/', async (req, res) => {
    try {
        console.log('📝 POST /api/requests - Request body:', req.body);

        // Generate YAS request number
        const { data: existingRequests } = await supabase.from('requests').select('request_number').order('created_at', { ascending: false }).limit(1);
        let nextNumber = 1;
        if (existingRequests && existingRequests.length > 0) {
            const lastRequestNumber = existingRequests[0].request_number;
            const match = lastRequestNumber.match(/YAS (\d+)/);
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

module.exports = router;
