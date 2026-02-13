/**
 * Work Order Initialization API Route
 *
 * POST /api/work-orders/init
 * Initializes a work order in Supabase when technician starts working on it
 *
 * Flow:
 * 1. Authenticate user
 * 2. Validate work order ID
 * 3. Check if already initialized (return existing)
 * 4. Fetch work order details from Airtable
 * 5. Verify authorization (assigned to this technician)
 * 6. Create work_orders record in Supabase
 * 7. Return work order data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchWorkOrderById } from '@/lib/airtable';
import { USE_MOCK_DATA, MOCK_WORK_ORDERS } from '@/lib/mockData';
import { db } from '@/lib/db';
import { workOrders } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

interface InitRequest {
  workOrderId: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body: InitRequest = await request.json();
    const { workOrderId } = body;

    if (!workOrderId) {
      return NextResponse.json(
        { error: 'workOrderId is required' },
        { status: 400 }
      );
    }

    console.log('📋 Initializing work order:', workOrderId, 'for user:', user.email);

    // 3. Check if already initialized in Supabase
    const existingWorkOrder = await db.query.workOrders.findFirst({
      where: and(
        eq(workOrders.workOrderId, workOrderId),
        eq(workOrders.technicianUserId, user.id)
      ),
    });

    if (existingWorkOrder) {
      console.log('✅ Work order already initialized:', existingWorkOrder.id);
      return NextResponse.json({
        workOrder: existingWorkOrder,
        message: 'Work order already initialized',
      });
    }

    // 4. Fetch work order details from Airtable (or mock)
    let airtableWorkOrder;
    if (USE_MOCK_DATA) {
      console.log('🎭 Using mock data');
      airtableWorkOrder = MOCK_WORK_ORDERS.find(
        (wo) => wo.workOrderId === workOrderId
      );
    } else {
      console.log('🔗 Fetching from Airtable');
      airtableWorkOrder = await fetchWorkOrderById(workOrderId);
    }

    if (!airtableWorkOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // 5. Authorization check - verify work order is assigned to this technician
    if (airtableWorkOrder.technicianEmail !== user.email) {
      console.error(
        '❌ Authorization failed:',
        'WO assigned to',
        airtableWorkOrder.technicianEmail,
        'but user is',
        user.email
      );
      return NextResponse.json(
        { error: 'This work order is not assigned to you' },
        { status: 403 }
      );
    }

    // 6. Create work order in Supabase
    const [newWorkOrder] = await db
      .insert(workOrders)
      .values({
        workOrderId: airtableWorkOrder.workOrderId,
        technicianUserId: user.id,
        status: 'in_progress',
        workType: airtableWorkOrder.workType,
        initialIssue: airtableWorkOrder.initialIssue,
        pointCode: airtableWorkOrder.pointCode,
        lockerVersion: airtableWorkOrder.lockerVersion,
        client: airtableWorkOrder.client,
      })
      .returning();

    console.log('✅ Work order initialized in Supabase:', newWorkOrder.id);

    // 7. Return success
    return NextResponse.json({
      workOrder: newWorkOrder,
      message: 'Work order initialized successfully',
    });
  } catch (error) {
    console.error('❌ Failed to initialize work order:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize work order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
