/**
 * Test n8n Webhook Integration
 *
 * Sends a sample work order completion payload to test the n8n workflow
 */

// Load env from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

async function testN8nWebhook() {
  console.log('🔍 Testing n8n webhook integration...\n');

  // Check environment variables
  console.log('✓ Checking environment variables...');
  if (!process.env.N8N_WEBHOOK_URL) {
    console.error('  ❌ N8N_WEBHOOK_URL not set in .env.local');
    process.exit(1);
  }
  if (!process.env.N8N_WEBHOOK_SECRET) {
    console.error('  ❌ N8N_WEBHOOK_SECRET not set in .env.local');
    process.exit(1);
  }
  console.log('  ✅ Environment variables set\n');

  // Sample payload (minimal for MVP test)
  const testPayload = {
    workOrderId: '88460',
    technicianEmail: 'cfigueredo@dicharger.es',
    completedAt: new Date().toISOString(),
    formSubmissions: [],
    batterySwaps: [],
    partsUsed: [],
  };

  console.log('📤 Sending test payload to n8n...');
  console.log('   URL:', process.env.N8N_WEBHOOK_URL);
  console.log('   Payload:', JSON.stringify(testPayload, null, 2));
  console.log();

  try {
    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(testPayload),
    });

    console.log('📥 Response received:');
    console.log('   Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ Error:', errorText);
      process.exit(1);
    }

    const responseText = await response.text();
    console.log('   Raw response:', responseText || '(empty)');

    let responseData;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
      console.log('   ✅ Success!');
      console.log('   Parsed response:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('   ⚠️  Response is not valid JSON, but request succeeded (200 OK)');
    }
    console.log();

    console.log('🎉 SUCCESS! n8n webhook is working!\n');
    console.log('Next steps:');
    console.log('  1. Check your Airtable Work Orders table');
    console.log('  2. Work order 88460 should be updated to "4-Completed"');
    console.log('  3. Status should be "Completed"');
    console.log('  4. Ready to integrate with the app!\n');
  } catch (error) {
    console.error('❌ n8n webhook test failed:', error);
    console.log('\nPossible issues:');
    console.log('  1. Check N8N_WEBHOOK_URL is correct');
    console.log('  2. Check N8N_WEBHOOK_SECRET matches n8n credential');
    console.log('  3. Ensure n8n workflow is activated');
    console.log('  4. Check n8n logs for errors\n');
    process.exit(1);
  }
}

testN8nWebhook();
