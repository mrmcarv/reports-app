// Test Supabase Connection
// Run with: node scripts/test-supabase.js

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Testing Supabase Credentials...\n');
console.log('Project URL:', url);
console.log('Anon Key:', anonKey ? `${anonKey.substring(0, 20)}...` : '❌ Missing');
console.log('Service Key:', serviceKey ? `${serviceKey.substring(0, 20)}...` : '❌ Missing');
console.log('\n' + '='.repeat(60) + '\n');

// Test 1: Check URL format
console.log('✓ Test 1: Project URL format');
if (!url || !url.includes('.supabase.co')) {
  console.log('  ❌ FAILED: Invalid Supabase URL format');
  process.exit(1);
}
console.log('  ✅ PASSED: URL format looks good\n');

// Test 2: Test anon key connection
console.log('✓ Test 2: Testing anon key (public) connection...');
fetch(`${url}/rest/v1/`, {
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  }
})
.then(async response => {
  if (response.ok || response.status === 200) {
    console.log('  ✅ PASSED: Anon key works!\n');

    // Test 3: Test service role key
    console.log('✓ Test 3: Testing service role key (admin) connection...');
    return fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
  } else {
    throw new Error(`Anon key failed with status ${response.status}`);
  }
})
.then(async response => {
  if (response.ok || response.status === 200) {
    console.log('  ✅ PASSED: Service role key works!\n');
    console.log('='.repeat(60));
    console.log('\n✅ SUCCESS! All Supabase credentials are valid!\n');
    console.log('Next steps:');
    console.log('  1. Database migrations');
    console.log('  2. Set up authentication');
    console.log('  3. Start building!\n');
    process.exit(0);
  } else {
    throw new Error(`Service role key failed with status ${response.status}`);
  }
})
.catch(error => {
  console.log('  ❌ FAILED:', error.message);
  console.log('\n' + '='.repeat(60));
  console.log('\n❌ Connection test failed!\n');
  console.log('Possible issues:');
  console.log('  1. Keys might be truncated or incomplete');
  console.log('  2. Copy the FULL keys from Supabase dashboard');
  console.log('  3. Keys should be ~300 characters long and start with "eyJhbGc..."');
  console.log('  4. Check Settings → API in your Supabase dashboard\n');
  process.exit(1);
});
