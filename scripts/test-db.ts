/**
 * Test Database Connection
 *
 * Verifies that all tables were created successfully in Supabase
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/schema';

// Load env from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL!;

async function testDatabase() {
  console.log('🔍 Testing database connection...\n');

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  try {
    // Test 1: Check if work_orders table exists
    console.log('✓ Test 1: Querying work_orders table...');
    const workOrders = await db.select().from(schema.workOrders).limit(1);
    console.log(`  ✅ work_orders table exists (${workOrders.length} rows)\n`);

    // Test 2: Check if form_submissions table exists
    console.log('✓ Test 2: Querying form_submissions table...');
    const formSubmissions = await db.select().from(schema.formSubmissions).limit(1);
    console.log(`  ✅ form_submissions table exists (${formSubmissions.length} rows)\n`);

    // Test 3: Check if battery_swaps table exists
    console.log('✓ Test 3: Querying battery_swaps table...');
    const batterySwaps = await db.select().from(schema.batterySwaps).limit(1);
    console.log(`  ✅ battery_swaps table exists (${batterySwaps.length} rows)\n`);

    // Test 4: Check if parts_used table exists
    console.log('✓ Test 4: Querying parts_used table...');
    const partsUsed = await db.select().from(schema.partsUsed).limit(1);
    console.log(`  ✅ parts_used table exists (${partsUsed.length} rows)\n`);

    console.log('🎉 SUCCESS! All database tables created successfully!\n');
    console.log('Tables created:');
    console.log('  - work_orders');
    console.log('  - form_submissions');
    console.log('  - battery_swaps');
    console.log('  - parts_used\n');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabase();
