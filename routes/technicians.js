const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

// Get all technicians
router.get('/', async (req, res) => {
    try {
        console.log('👨‍🔧 GET /api/technicians');
        const { data, error } = await supabase
            .from('technicians')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching technicians:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get technician by ID
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('technicians')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Technician not found' });
        res.json(data);
    } catch (error) {
        console.error('Error fetching technician:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get technician statistics
router.get('/:id/stats', async (req, res) => {
    try {
        const technicianId = req.params.id;
        
        // Get completed requests by this technician
        const { data: requests, error: requestsError } = await supabase
            .from('requests')
            .select('*')
            .eq('technician_id', technicianId)
            .eq('status', 'Delivered');
        
        if (requestsError) throw requestsError;
        
        // Get ratings for this technician
        const { data: ratings, error: ratingsError } = await supabase
            .from('technician_ratings')
            .select('*')
            .eq('technician_id', technicianId);
        
        if (ratingsError) throw ratingsError;
        
        // Calculate statistics
        const completedCount = requests?.length || 0;
        const ratingCount = ratings?.length || 0;
        const averageRating = ratingCount > 0 
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount 
            : 0;
        
        // Calculate average completion time
        let avgCompletionTime = 0;
        if (completedCount > 0) {
            const completionTimes = requests
                .filter(r => r.created_at && r.updated_at)
                .map(r => {
                    const created = new Date(r.created_at);
                    const updated = new Date(r.updated_at);
                    return (updated - created) / (1000 * 60 * 60); // in hours
                });
            
            if (completionTimes.length > 0) {
                avgCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
            }
        }
        
        res.json({
            completedRequests: completedCount,
            totalRatings: ratingCount,
            averageRating: averageRating.toFixed(1),
            averageCompletionTime: avgCompletionTime.toFixed(1),
            recentRequests: requests?.slice(0, 10) || [],
            recentRatings: ratings?.slice(0, 10) || []
        });
    } catch (error) {
        console.error('Error fetching technician stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new technician
router.post('/', async (req, res) => {
    try {
        const newTechnician = { 
            ...req.body, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('technicians')
            .insert([newTechnician])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creating technician:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update technician
router.put('/:id', async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('technicians')
            .update(updateData)
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        if (!data || data.length === 0) return res.status(404).json({ error: 'Technician not found' });
        res.json(data[0]);
    } catch (error) {
        console.error('Error updating technician:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete technician
router.delete('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('technicians')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting technician:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all technician ratings
router.get('/:id/ratings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('technician_ratings')
            .select('*')
            .eq('technician_id', req.params.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching technician ratings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add rating for technician
router.post('/:id/ratings', async (req, res) => {
    try {
        const newRating = { 
            ...req.body, 
            technician_id: req.params.id,
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('technician_ratings')
            .insert([newRating])
            .select();
        
        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creating technician rating:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
