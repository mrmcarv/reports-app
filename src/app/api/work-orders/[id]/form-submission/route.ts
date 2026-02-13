/**
 * Form Submission API Route
 *
 * Saves form data (maintenance, wind_audit, survey) to form_submissions table
 * Stores form data as JSONB with embedded photo URLs
 *
 * POST /api/work-orders/[id]/form-submission
 * Body: { formType: string, formData: object }
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { workOrders, formSubmissions } from '@/lib/schema';
import { eq } from 'drizzle-orm';

interface FormSubmissionRequest {
  formType: 'maintenance' | 'wind_audit' | 'survey';
  formData: Record<string, any>;
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
    const body: FormSubmissionRequest = await request.json();
    const { formType, formData } = body;

    if (!formType || !formData) {
      return Response.json(
        { error: 'Missing formType or formData' },
        { status: 400 }
      );
    }

    // Validate form type
    if (!['maintenance', 'wind_audit', 'survey'].includes(formType)) {
      return Response.json(
        { error: 'Invalid form type' },
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
        { error: 'You do not have permission to submit this form' },
        { status: 403 }
      );
    }

    // 5. Save form submission to database
    const [savedSubmission] = await db
      .insert(formSubmissions)
      .values({
        workOrderId: workOrder.id,
        formType,
        formData,
      })
      .returning();

    console.log(`✅ Saved ${formType} form submission:`, savedSubmission.id);

    // 6. Update work order status to completed
    await db
      .update(workOrders)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrder.id));

    console.log(`✅ Marked work order ${workOrder.workOrderId} as completed`);

    return Response.json({
      success: true,
      submissionId: savedSubmission.id,
      message: 'Form submitted successfully',
    });
  } catch (error) {
    console.error('❌ Failed to save form submission:', error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save form submission',
      },
      { status: 500 }
    );
  }
}
