/**
 * Work Orders API Route
 *
 * GET /api/work-orders
 * Fetches work orders for the logged-in technician from Airtable
 *
 * Returns work orders grouped by date (Today, Upcoming, Overdue)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchWorkOrdersForTechnician,
  groupWorkOrdersByDate,
} from '@/lib/airtable';

export async function GET() {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📋 Fetching work orders for:', user.email);

    // 2. Fetch work orders from Airtable
    const workOrders = await fetchWorkOrdersForTechnician(user.email);

    console.log(`✅ Found ${workOrders.length} work orders`);

    // 3. Group by date
    const grouped = groupWorkOrdersByDate(workOrders);

    // 4. Return response
    return NextResponse.json({
      workOrders: {
        today: grouped.today,
        upcoming: grouped.upcoming,
        overdue: grouped.overdue,
      },
      total: workOrders.length,
      counts: {
        today: grouped.today.length,
        upcoming: grouped.upcoming.length,
        overdue: grouped.overdue.length,
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch work orders:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch work orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
