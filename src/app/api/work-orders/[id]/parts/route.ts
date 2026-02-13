/**
 * Parts API Route
 *
 * Saves parts used for completed form submissions
 * Links parts to form_submissions via formSubmissionId
 *
 * POST /api/work-orders/[id]/parts
 * Body: { parts: [{ formSubmissionId, partName, quantity }] }
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { workOrders, partsUsed, formSubmissions } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';

interface PartData {
  formSubmissionId: number;
  partName: string;
  quantity: number;
}

interface PartsRequest {
  parts: PartData[];
}

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

    // 3. Parse request body
    const body: PartsRequest = await request.json();
    const { parts } = body;

    if (!parts || !Array.isArray(parts)) {
      return Response.json(
        { error: 'Parts array is required' },
        { status: 400 }
      );
    }

    // 4. Verify work order exists and belongs to user
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
    });

    if (!workOrder) {
      return Response.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (workOrder.technicianUserId !== user.id) {
      return Response.json(
        { error: 'You do not have permission to add parts to this work order' },
        { status: 403 }
      );
    }

    // 5. Verify all form submissions belong to this work order
    if (parts.length > 0) {
      const formSubmissionIds = [
        ...new Set(parts.map((p) => p.formSubmissionId)),
      ];

      const submissions = await db.query.formSubmissions.findMany({
        where: inArray(formSubmissions.id, formSubmissionIds),
      });

      if (submissions.length !== formSubmissionIds.length) {
        return Response.json(
          { error: 'Some form submissions not found' },
          { status: 404 }
        );
      }

      // Check all submissions belong to this work order
      const invalidSubmissions = submissions.filter(
        (s) => s.workOrderId !== workOrder.id
      );

      if (invalidSubmissions.length > 0) {
        return Response.json(
          { error: 'Form submissions do not belong to this work order' },
          { status: 400 }
        );
      }
    }

    // 6. Save parts to database
    const savedParts = [];

    for (const part of parts) {
      if (!part.partName || part.partName.trim() === '') {
        continue; // Skip empty part names
      }

      const [savedPart] = await db
        .insert(partsUsed)
        .values({
          workOrderId: workOrder.id,
          formSubmissionId: part.formSubmissionId,
          partName: part.partName.trim(),
          quantity: part.quantity || 1,
        })
        .returning();

      savedParts.push(savedPart);
      console.log(
        `✅ Saved part: ${part.partName} (qty: ${part.quantity}) for form ${part.formSubmissionId}`
      );
    }

    console.log(
      `✅ Saved ${savedParts.length} parts for work order ${workOrder.workOrderId}`
    );

    return Response.json({
      success: true,
      partsCount: savedParts.length,
      parts: savedParts,
      message: `${savedParts.length} part(s) saved successfully`,
    });
  } catch (error) {
    console.error('❌ Failed to save parts:', error);
    return Response.json(
      {
        error: 'Failed to save parts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
