const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Missing Supabase credentials in environment variables');
  console.warn('📝 Using dummy Supabase client for development');
  console.warn('⚠️  In production, set SUPABASE_URL and SUPABASE_ANON_KEY');
  
  // Use dummy values for development if not available
  if (!supabaseUrl) {
    process.env.SUPABASE_URL = 'https://dummy.supabase.co';
  }
  if (!supabaseKey) {
    process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwfQ.dummy';
  }
}

try {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('✅ Supabase client initialized');
  module.exports = supabase;
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error.message);
  
  // Create a mock supabase client for development
  const mockSupabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: [], error: null }),
      delete: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({ select: () => Promise.resolve({ data: null, error: null }) })
    })
  };
  
  console.warn('⚠️  Using mock Supabase client for development');
  module.exports = mockSupabase;
}

