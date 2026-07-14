const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('requests').select('*');
      if (error) throw error;
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const newRequest = {
        request_number: req.body.requestNumber || `REQ-${Date.now()}`,
        full_name: req.body.fullName,
        phone: req.body.phone,
        email: req.body.email || '',
        laptop_brand: req.body.laptopBrand,
        laptop_model: req.body.laptopModel,
        problem_description: req.body.problemDescription,
        status: req.body.status || 'Received',
        priority: req.body.priority || 'Medium',
        cost: req.body.cost || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (req.body.adminReply !== undefined) newRequest.admin_reply = req.body.adminReply;
      if (req.body.estimatedCompletionDate !== undefined) newRequest.estimated_completion_date = req.body.estimatedCompletionDate;

      const { data, error } = await supabase.from('requests').insert([newRequest]).select();
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const updateData = { ...req.body, updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('requests').update(updateData).eq('id', req.query.id).select();
      if (error) throw error;
      if (!data || data.length === 0) return res.status(404).json({ error: 'Request not found' });
      res.status(200).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { error } = await supabase.from('requests').delete().eq('id', req.query.id);
      if (error) throw error;
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
