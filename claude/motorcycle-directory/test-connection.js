// Test Supabase Connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connectivity
    const { data, error } = await supabase
      .from('motorcycle_repairs')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection test failed:', error.message);
      console.error('Error details:', error);
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log('Response:', data);

    // Check if we can list tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      console.log('Note: Could not list tables (this is expected if RPC function does not exist)');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();
