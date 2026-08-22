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
        const updateData = {
            admin_reply: req.body.admin_reply,
            cost: req.body.cost,
            technician: req.body.technician,
            estimated_completion_date: req.body.estimated_completion_date,
            status: req.body.status
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const { data, error } = await supabase
            .from('company_requests')
            .update(updateData)
            .eq('id', req.params.id)
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

        res.json(camelCaseData);
    } catch (error) {
        console.error('Error updating company request:', error);
        res.status(500).json({ error: 'Failed to update company request' });
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
        res.status(500).json({ error: 'Failed to delete company request' });
    }
});

// DELETE /api/company-requests - Delete all company requests
router.delete('/', async (req, res) => {
    try {
        const { error } = await supabase
            .from('company_requests')
            .delete()
            .not('id', 'is', null);

        if (error) throw error;

        res.json({ message: 'All company requests deleted successfully' });
    } catch (error) {
        console.error('Error deleting all company requests:', error);
        res.status(500).json({ error: 'Failed to delete all company requests' });
    }
});

module.exports = router;
