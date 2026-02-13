/**
 * Battery Swaps API Route
 *
 * POST /api/work-orders/[id]/battery-swaps
 * Saves battery swap entries to Supabase and completes the work order
 *
 * Flow:
 * 1. Authenticate user
 * 2. Verify work order exists and belongs to user
 * 3. Save each battery swap to battery_swaps table
 * 4. Update work order status to 'completed'
 * 5. Set completedAt timestamp
 * 6. Return success
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { workOrders, batterySwaps } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

interface BatterySwapEntry {
  batteryPosition: '1' | '2' | '3';
  oldBatterySn: string;
  newBatterySn: string;
}

interface BatterySwapRequest {
  swaps: BatterySwapEntry[];
  notes?: string;
  photos: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { id } = await params;
    const workOrderId = parseInt(id);

    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body: BatterySwapRequest = await request.json();
    const { swaps, notes, photos } = body;

    if (!swaps || swaps.length === 0) {
      return NextResponse.json(
        { error: 'At least one battery swap is required' },
        { status: 400 }
      );
    }

    console.log(
      `📋 Saving ${swaps.length} battery swap(s) for work order:`,
      workOrderId
    );

    // 3. Verify work order exists and belongs to user
    const workOrder = await db.query.workOrders.findFirst({
      where: and(
        eq(workOrders.id, workOrderId),
        eq(workOrders.technicianUserId, user.id)
      ),
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found or not assigned to you' },
        { status: 404 }
      );
    }

    // 4. Check for duplicate positions
    const positions = swaps.map((s) => s.batteryPosition);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      return NextResponse.json(
        { error: 'Duplicate battery positions not allowed' },
        { status: 400 }
      );
    }

    // 5. Save each battery swap to database
    const savedSwaps = [];
    for (const swap of swaps) {
      const [savedSwap] = await db
        .insert(batterySwaps)
        .values({
          workOrderId: workOrder.id,
          batteryPosition: swap.batteryPosition,
          oldBatterySn: swap.oldBatterySn.trim(),
          newBatterySn: swap.newBatterySn.trim(),
        })
        .returning();

      savedSwaps.push(savedSwap);
      console.log(
        `✅ Saved battery swap: Position ${swap.batteryPosition} (${savedSwap.id})`
      );
    }

    // 6. Update work order to completed
    const [updatedWorkOrder] = await db
      .update(workOrders)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrder.id))
      .returning();

    console.log(`✅ Work order ${workOrderId} completed`);

    // 7. Return success with saved data
    return NextResponse.json({
      success: true,
      workOrder: updatedWorkOrder,
      batterySwaps: savedSwaps,
      notes,
      photos,
      message: `${swaps.length} battery swap(s) saved successfully`,
    });
  } catch (error) {
    console.error('❌ Failed to save battery swaps:', error);
    return NextResponse.json(
      {
        error: 'Failed to save battery swaps',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
