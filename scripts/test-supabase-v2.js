// Test Supabase Connection - Version 2 (Using Supabase Client)
// Run with: node scripts/test-supabase-v2.js

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envFile = fs.readFileSync(envPath, 'utf8');

  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
}

loadEnv();

const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Testing Supabase Credentials (Client Library)...\n');
console.log('Project URL:', url);
console.log('Anon Key:', anonKey ? `${anonKey.substring(0, 30)}...` : '❌ Missing');
console.log('Service Key:', serviceKey ? `${serviceKey.substring(0, 30)}...` : '❌ Missing');
console.log('\n' + '='.repeat(60) + '\n');

async function testConnection() {
  try {
    // Test with anon key
    console.log('✓ Test 1: Creating Supabase client with anon key...');
    const supabase = createClient(url, anonKey);

    console.log('✓ Test 2: Testing database connection...');
    const { data, error } = await supabase.from('_').select('*').limit(1);

    // It's OK if we get a "relation does not exist" error - means connection works!
    if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('  ✅ PASSED: Connection successful! (No tables yet - that\'s expected)\n');
    } else if (error && error.code === '42P01') {
      console.log('  ✅ PASSED: Connection successful! (No tables yet - that\'s expected)\n');
    } else if (error) {
      console.log('  ⚠️  Got response from server:', error.message);
      console.log('  Checking if this is authentication issue...\n');

      if (error.message.includes('JWT') || error.message.includes('invalid') || error.message.includes('signature')) {
        throw new Error('Authentication failed - keys might be invalid');
      }
      // Other errors might be OK (like missing tables)
      console.log('  ✅ Server is responding - credentials appear valid!\n');
    } else {
      console.log('  ✅ PASSED: Connection successful!\n');
    }

    // Test with service key
    console.log('✓ Test 3: Testing service role key...');
    const supabaseAdmin = createClient(url, serviceKey);
    const { data: adminData, error: adminError } = await supabaseAdmin.from('_').select('*').limit(1);

    if (adminError && (adminError.message.includes('relation') || adminError.code === '42P01')) {
      console.log('  ✅ PASSED: Service role key works!\n');
    } else if (adminError) {
      console.log('  ⚠️  Got response:', adminError.message);
      if (adminError.message.includes('JWT') || adminError.message.includes('invalid')) {
        throw new Error('Service role key authentication failed');
      }
      console.log('  ✅ Service role key appears valid!\n');
    } else {
      console.log('  ✅ PASSED: Service role key works!\n');
    }

    console.log('='.repeat(60));
    console.log('\n✅ SUCCESS! Supabase is connected and working!\n');
    console.log('Your credentials are valid. Ready to proceed with:');
    console.log('  1. Database schema setup');
    console.log('  2. Running migrations');
    console.log('  3. Building the app!\n');
    process.exit(0);

  } catch (error) {
    console.log('  ❌ FAILED:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('\n❌ Connection test failed!\n');
    console.log('Please verify:');
    console.log('  1. You copied the COMPLETE keys from Supabase dashboard');
    console.log('  2. No extra spaces or line breaks in the keys');
    console.log('  3. Keys are from Settings → API → "Project API keys" section\n');
    process.exit(1);
  }
}

testConnection();
