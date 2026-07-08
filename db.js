const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Initializing Supabase...');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? '✅ SET' : '❌ NOT SET');

if (supabaseUrl && supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully!');
    module.exports = supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error.message);
    throw error;
  }
} else {
  console.log('⚠️  Supabase credentials not found, running in local mode');
  console.log('📝 Creating mock Supabase client for local development');
  
  // Mock Supabase client for local development
  const mockSupabase = {
    from: (table) => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ single: () => ({ data: null, error: null }) }),
      order: () => ({ data: [], error: null }),
      or: () => ({ data: [], error: null })
    })
  };
  module.exports = mockSupabase;
}

