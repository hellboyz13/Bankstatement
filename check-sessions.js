// Quick diagnostic script to check sessions table
// Run with: node check-sessions.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Supabase Configuration Check ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing required environment variables!');
  console.log('');
  console.log('To fix this:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Settings > API');
  console.log('3. Copy the "service_role" key (NOT the anon key)');
  console.log('4. Add it to your .env.local file as:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  process.exit(1);
}

async function checkSessions() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('=== Checking Sessions Table ===');

  // Try to fetch all sessions (service role bypasses RLS)
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('upload_date', { ascending: false });

  if (error) {
    console.error('ERROR fetching sessions:', error);
    console.log('');
    console.log('This might mean:');
    console.log('1. The sessions table does not exist');
    console.log('2. RLS policies are blocking the service role');
    console.log('3. The service role key is incorrect');
    console.log('');
    console.log('To fix:');
    console.log('1. Run CREATE_SESSIONS_TABLE.sql in your Supabase SQL Editor');
    console.log('2. Run fix-sessions-rls.sql to update RLS policies');
    return;
  }

  console.log(`✓ Found ${data.length} session(s) in the database`);
  console.log('');

  if (data.length > 0) {
    console.log('Sessions:');
    data.forEach((session, i) => {
      console.log(`${i + 1}. ${session.filename} (${session.transaction_count} transactions)`);
      console.log(`   User: ${session.user_id}`);
      console.log(`   Uploaded: ${new Date(session.upload_date).toLocaleString()}`);
      console.log('');
    });
  } else {
    console.log('No sessions found in database.');
    console.log('This is normal if you have not uploaded any statements yet.');
  }
}

checkSessions().catch(console.error);
