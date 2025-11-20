// Run Database Migration Script
// This script executes the database-schema.sql file against Supabase
// Note: This requires the service_role key (not anon key) to create tables

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

console.log('⚠️  This script requires a SERVICE_ROLE_KEY to execute DDL commands.');
console.log('⚠️  The ANON_KEY in .env.local does not have permission to create tables.\n');
console.log('To run this migration, you have two options:\n');
console.log('1. Use Supabase CLI (recommended):');
console.log('   npm install -g supabase');
console.log('   supabase login');
console.log('   supabase link --project-ref mcfyffbyiohcsimzwhoh');
console.log('   supabase db push --db-url "postgres://postgres:[YOUR-PASSWORD]@db.mcfyffbyiohcsimzwhoh.supabase.co:5432/postgres"\n');
console.log('2. Use the SQL Editor in Supabase Dashboard:');
console.log('   - Go to: https://supabase.com/dashboard/project/mcfyffbyiohcsimzwhoh/sql');
console.log('   - Create a new query');
console.log('   - Copy and paste the contents of database-schema.sql');
console.log('   - Run the query\n');
console.log('3. Get your service_role key and add it to .env.local:');
console.log('   - Go to: https://supabase.com/dashboard/project/mcfyffbyiohcsimzwhoh/settings/api');
console.log('   - Copy the service_role key (⚠️  Keep this secret!)');
console.log('   - Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here');
console.log('   - Re-run this script\n');

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.log('❌ SERVICE_ROLE_KEY not found in .env.local');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file and try again.\n');
  process.exit(1);
}

// If service role key is available, execute the migration
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('📖 Reading database-schema.sql...');
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'database-schema.sql'),
      'utf8'
    );

    console.log('🚀 Executing migration...');
    console.log('⚠️  Note: Supabase JS client may not support all DDL operations.');
    console.log('   If this fails, use the Supabase CLI or SQL Editor instead.\n');

    // Try to execute the SQL (this may not work with all DDL statements)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlFile });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('\n💡 Try using Supabase CLI instead (see instructions above)');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('Response:', data);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n💡 This is expected - use Supabase CLI or SQL Editor instead');
    process.exit(1);
  }
}

runMigration();
