/**
 * Test Airtable Integration
 *
 * Verifies that we can connect to Airtable and fetch work orders
 *
 * Environment variables are loaded via dotenv-cli (see package.json script)
 */

import {
  fetchWorkOrdersForTechnician,
  fetchWorkOrderById,
  groupWorkOrdersByDate,
} from '../src/lib/airtable';

async function testAirtable() {
  console.log('🔍 Testing Airtable integration...\n');

  // Check environment variables
  console.log('✓ Checking environment variables...');
  if (!process.env.AIRTABLE_API_KEY) {
    console.error('  ❌ AIRTABLE_API_KEY not set in .env.local');
    process.exit(1);
  }
  if (!process.env.AIRTABLE_BASE_ID_DEBLOQ) {
    console.error('  ❌ AIRTABLE_BASE_ID_DEBLOQ not set in .env.local');
    process.exit(1);
  }
  console.log('  ✅ Environment variables set\n');

  // Prompt for technician email
  console.log('📧 Enter technician email to test:');
  console.log('   (This should be the email assigned to work orders in Airtable)');
  console.log('   Example: technician@example.com\n');

  // For testing, you can hardcode an email or pass as argument
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.log('❌ Please provide technician email as argument:');
    console.log('   npm run test:airtable -- technician@example.com\n');
    process.exit(1);
  }

  console.log(`\n🔍 Fetching work orders for: ${testEmail}\n`);

  try {
    // Test 1: Fetch work orders for technician
    console.log('✓ Test 1: Fetching work orders...');
    const workOrders = await fetchWorkOrdersForTechnician(testEmail);

    console.log(`  ✅ Fetched ${workOrders.length} work orders\n`);

    if (workOrders.length === 0) {
      console.log('ℹ️  No work orders found for this technician.');
      console.log('   Make sure:');
      console.log('   1. The technician email exists in Airtable');
      console.log('   2. Work orders are assigned to this technician');
      console.log('   3. Work orders have step="SCHEDULED" and status="ON_TRACK"\n');
      return;
    }

    // Display work orders
    console.log('📋 Work Orders Found:');
    console.log('─'.repeat(80));
    workOrders.forEach((wo, index) => {
      console.log(`\n${index + 1}. ${wo.workOrderId}`);
      console.log(`   Type: ${wo.workType}`);
      console.log(`   Client: ${wo.client || 'N/A'}`);
      console.log(`   Point Code: ${wo.pointCode || 'N/A'}`);
      console.log(`   Planned Date: ${wo.plannedDate || 'N/A'}`);
      console.log(`   Initial Issue: ${wo.initialIssue || 'N/A'}`);
    });
    console.log('\n' + '─'.repeat(80));

    // Test 2: Group work orders by date
    console.log('\n✓ Test 2: Grouping work orders by date...');
    const grouped = groupWorkOrdersByDate(workOrders);

    console.log(`  ✅ Grouped work orders:`);
    console.log(`     - Today: ${grouped.today.length} work orders`);
    console.log(`     - Upcoming: ${grouped.upcoming.length} work orders`);
    console.log(`     - Overdue: ${grouped.overdue.length} work orders\n`);

    // Display grouped work orders
    if (grouped.overdue.length > 0) {
      console.log('⚠️  Overdue:');
      grouped.overdue.forEach((wo) =>
        console.log(`   - ${wo.workOrderId} (${wo.plannedDate})`)
      );
      console.log();
    }

    if (grouped.today.length > 0) {
      console.log('📅 Today:');
      grouped.today.forEach((wo) =>
        console.log(`   - ${wo.workOrderId} (${wo.plannedDate})`)
      );
      console.log();
    }

    if (grouped.upcoming.length > 0) {
      console.log('📆 Upcoming:');
      grouped.upcoming.forEach((wo) =>
        console.log(`   - ${wo.workOrderId} (${wo.plannedDate})`)
      );
      console.log();
    }

    // Test 3: Fetch single work order by ID
    if (workOrders.length > 0) {
      const firstWO = workOrders[0];
      console.log(`✓ Test 3: Fetching single work order (${firstWO.workOrderId})...`);

      const singleWO = await fetchWorkOrderById(firstWO.workOrderId);

      if (singleWO) {
        console.log(`  ✅ Successfully fetched work order`);
        console.log(`     - ID: ${singleWO.workOrderId}`);
        console.log(`     - Type: ${singleWO.workType}`);
        console.log(`     - Client: ${singleWO.client || 'N/A'}\n`);
      } else {
        console.log(`  ❌ Work order not found\n`);
      }
    }

    console.log('🎉 SUCCESS! Airtable integration is working!\n');
    console.log('Next steps:');
    console.log('  1. The dashboard can now fetch work orders');
    console.log('  2. Work orders will be displayed grouped by date');
    console.log('  3. Ready to build the dashboard UI!\n');
  } catch (error) {
    console.error('❌ Airtable test failed:', error);
    console.log('\nPossible issues:');
    console.log('  1. Check AIRTABLE_API_KEY in .env.local');
    console.log('  2. Check AIRTABLE_BASE_ID_DEBLOQ is correct');
    console.log('  3. Verify field names match your Airtable schema');
    console.log('  4. Check that the "Work Orders" table exists\n');
    process.exit(1);
  }
}

testAirtable();
