/**
 * Database Cleanup API Route (Development Only)
 *
 * Deletes all work order data from Supabase for testing.
 * Only enabled in development environment.
 *
 * Usage: POST http://localhost:3000/api/admin/cleanup
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { workOrders, formSubmissions, batterySwaps, partsUsed } from '@/lib/schema';
import { checkAdmin } from '@/lib/admin';

export async function POST(request: Request) {
  // Security: Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Cleanup endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Auth check (require logged in user)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check (require admin user)
    const adminCheck = checkAdmin(user);
    if (!adminCheck.isAdmin) {
      console.warn(`⚠️ Non-admin user attempted cleanup: ${user.email}`);
      return Response.json(
        {
          error: 'Admin access required',
          reason: adminCheck.reason,
        },
        { status: 403 }
      );
    }

    console.log(`🔐 Admin user ${user.email} initiated cleanup`);

    console.log('🧹 Starting database cleanup...');

    // Get counts before cleanup
    const beforeCounts = {
      workOrders: await db.$count(workOrders),
      formSubmissions: await db.$count(formSubmissions),
      batterySwaps: await db.$count(batterySwaps),
      partsUsed: await db.$count(partsUsed),
    };

    console.log('📊 Before cleanup:', beforeCounts);

    // Delete all data (in correct order)
    await db.delete(partsUsed);
    await db.delete(batterySwaps);
    await db.delete(formSubmissions);
    await db.delete(workOrders);

    console.log('✅ All data deleted');

    // Reset sequences via raw SQL
    await db.execute(`
      ALTER SEQUENCE parts_used_id_seq RESTART WITH 1;
      ALTER SEQUENCE battery_swaps_id_seq RESTART WITH 1;
      ALTER SEQUENCE form_submissions_id_seq RESTART WITH 1;
      ALTER SEQUENCE work_orders_id_seq RESTART WITH 1;
    `);

    console.log('✅ Sequences reset to 1');

    // Get counts after cleanup
    const afterCounts = {
      workOrders: await db.$count(workOrders),
      formSubmissions: await db.$count(formSubmissions),
      batterySwaps: await db.$count(batterySwaps),
      partsUsed: await db.$count(partsUsed),
    };

    console.log('📊 After cleanup:', afterCounts);
    console.log('🎉 Database cleanup complete!');

    return Response.json({
      success: true,
      message: 'Database cleaned successfully',
      before: beforeCounts,
      after: afterCounts,
      deleted: {
        workOrders: beforeCounts.workOrders - afterCounts.workOrders,
        formSubmissions: beforeCounts.formSubmissions - afterCounts.formSubmissions,
        batterySwaps: beforeCounts.batterySwaps - afterCounts.batterySwaps,
        partsUsed: beforeCounts.partsUsed - afterCounts.partsUsed,
      },
    });
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    return Response.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { error: 'Admin endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const adminCheck = checkAdmin(user);
    if (!adminCheck.isAdmin) {
      return Response.json(
        {
          error: 'Admin access required',
          reason: adminCheck.reason,
        },
        { status: 403 }
      );
    }

    // Return current counts
    const counts = {
      workOrders: await db.$count(workOrders),
      formSubmissions: await db.$count(formSubmissions),
      batterySwaps: await db.$count(batterySwaps),
      partsUsed: await db.$count(partsUsed),
    };

    return Response.json({
      environment: process.env.NODE_ENV,
      counts,
      message: 'Use POST to this endpoint to clean database',
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to get counts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
