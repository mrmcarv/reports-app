/**
 * Work Order Completion API Route
 *
 * Finalizes work order and syncs to Airtable via n8n webhook
 *
 * Flow:
 * 1. Mark work order as completed in Supabase
 * 2. Fetch all related data (forms, battery swaps, parts)
 * 3. Prepare n8n payload with localIds
 * 4. Call n8n webhook (syncs to Airtable Reports base)
 * 5. Mark syncedToAirtable on success
 * 6. Return success/error to client
 *
 * POST /api/work-orders/[id]/complete
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  workOrders,
  formSubmissions,
  batterySwaps,
  partsUsed,
} from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get work order ID from params
    const { id } = await params;
    const workOrderId = parseInt(id, 10);

    if (isNaN(workOrderId)) {
      return Response.json({ error: 'Invalid work order ID' }, { status: 400 });
    }

    // 3. Verify work order exists and belongs to user
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
    });

    if (!workOrder) {
      return Response.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (workOrder.technicianUserId !== user.id) {
      return Response.json(
        { error: 'You do not have permission to complete this work order' },
        { status: 403 }
      );
    }

    // If already completed AND synced, return success immediately
    if (workOrder.status === 'completed' && workOrder.syncedToAirtable) {
      return Response.json({
        success: true,
        workOrderCompleted: true,
        synced: true,
        message: 'Work order already completed and synced',
        alreadyDone: true,
      });
    }

    // 4. Mark work order as completed in Supabase (if not already)
    let updatedWorkOrder = workOrder;

    if (workOrder.status !== 'completed') {
      [updatedWorkOrder] = await db
        .update(workOrders)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(workOrders.id, workOrder.id))
        .returning();

      console.log(`✅ Marked work order ${workOrder.workOrderId} as completed`);
    } else {
      console.log(
        `ℹ️ Work order ${workOrder.workOrderId} already completed, retrying sync...`
      );
    }

    // 5. Fetch all related data for n8n payload
    const forms = await db.query.formSubmissions.findMany({
      where: eq(formSubmissions.workOrderId, workOrder.id),
    });

    const swaps = await db.query.batterySwaps.findMany({
      where: eq(batterySwaps.workOrderId, workOrder.id),
    });

    const parts = await db.query.partsUsed.findMany({
      where: eq(partsUsed.workOrderId, workOrder.id),
    });

    console.log(`📦 Collected data for sync:`, {
      workOrderId: workOrder.workOrderId,
      forms: forms.length,
      batterySwaps: swaps.length,
      parts: parts.length,
    });

    // 6. Prepare n8n payload
    const n8nPayload = {
      workOrderId: workOrder.workOrderId,
      workType: workOrder.workType,
      technicianEmail: user.email,
      completedAt: updatedWorkOrder.completedAt?.toISOString(),

      // Form submissions with localId (Supabase ID) for mapping
      formSubmissions: forms.map((form) => ({
        localId: form.id, // Supabase form_submissions.id
        formType: form.formType,
        formData: form.formData,
        submittedAt: form.submittedAt.toISOString(),
      })),

      // Battery swaps
      batterySwaps: swaps.map((swap) => ({
        localId: swap.id, // Supabase battery_swaps.id
        batteryPosition: swap.batteryPosition,
        oldBatterySn: swap.oldBatterySn,
        newBatterySn: swap.newBatterySn,
        recordedAt: swap.recordedAt.toISOString(),
      })),

      // Parts used (with localId reference to form_submissions)
      partsUsed: parts.map((part) => ({
        localId: part.id, // Supabase parts_used.id
        formSubmissionLocalId: part.formSubmissionId, // Reference to form
        partName: part.partName,
        quantity: part.quantity,
        recordedAt: part.recordedAt.toISOString(),
      })),
    };

    // 7. Call n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    const n8nWebhookSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!n8nWebhookUrl) {
      console.error('❌ N8N_WEBHOOK_URL not configured');
      return Response.json(
        {
          error: 'n8n webhook not configured',
          workOrderCompleted: true,
          synced: false,
        },
        { status: 500 }
      );
    }

    try {
      console.log(`🔄 Calling n8n webhook for ${workOrder.workOrderId}...`);

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(n8nWebhookSecret && {
            'X-Webhook-Secret': n8nWebhookSecret,
          }),
        },
        body: JSON.stringify(n8nPayload),
      });

      const n8nResult = await n8nResponse.json();

      if (!n8nResponse.ok) {
        throw new Error(
          n8nResult.error || `n8n webhook failed: ${n8nResponse.status}`
        );
      }

      console.log(`✅ n8n webhook success:`, n8nResult);

      // 8. Mark as synced to Airtable
      await db
        .update(workOrders)
        .set({
          syncedToAirtable: true,
        })
        .where(eq(workOrders.id, workOrder.id));

      console.log(`✅ Marked work order ${workOrder.workOrderId} as synced`);

      return Response.json({
        success: true,
        workOrderCompleted: true,
        synced: true,
        message: 'Work order completed and synced to Airtable successfully',
        n8nResponse: n8nResult,
      });
    } catch (n8nError) {
      // n8n call failed, but work order is still marked as completed
      console.error('❌ n8n webhook failed:', n8nError);

      return Response.json(
        {
          success: false,
          workOrderCompleted: true,
          synced: false,
          error: 'Failed to sync to Airtable',
          message:
            n8nError instanceof Error
              ? n8nError.message
              : 'Unknown n8n error',
          canRetry: true,
        },
        { status: 207 } // Multi-Status: partial success
      );
    }
  } catch (error) {
    console.error('❌ Failed to complete work order:', error);
    return Response.json(
      {
        error: 'Failed to complete work order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
