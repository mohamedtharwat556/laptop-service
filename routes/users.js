const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all users
router.get('/', async (req, res) => {
    try {
        console.log('👥 GET /api/users');
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        
        // Convert snake_case to camelCase
        const converted = (data || []).map(item => ({
            id: item.id,
            username: item.username,
            email: item.email,
            name: item.name,
            role: item.role,
            createdAt: item.created_at
        }));
        
        res.json(converted);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'User not found' });
            }
            throw error;
        }
        if (!data) return res.status(404).json({ error: 'User not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create user
router.post('/', async (req, res) => {
    try {
        const { password, ...userData } = req.body;
        const newUser = { 
            ...userData, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabase.from('users').insert([newUser]).select();
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').update(req.body).eq('id', req.params.id).select();
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
