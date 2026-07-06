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
  console.error('❌ CRITICAL: Missing Supabase credentials!');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

