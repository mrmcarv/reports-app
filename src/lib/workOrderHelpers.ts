/**
 * Work Order Helper Functions
 *
 * Utilities for querying and managing work order state
 */

import { db } from '@/lib/db';
import { workOrders, formSubmissions, batterySwaps } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export interface CompletedForm {
  id: number;
  type: 'battery_swap' | 'maintenance' | 'wind_audit' | 'survey';
  submittedAt: Date;
  data?: any; // Form data for display
}

/**
 * Fetch all completed forms for a work order
 *
 * @param workOrderId - Supabase work_orders.id
 * @returns Array of completed forms
 */
export async function getCompletedForms(
  workOrderId: number
): Promise<CompletedForm[]> {
  const completed: CompletedForm[] = [];

  // 1. Check for battery swaps
  const swaps = await db.query.batterySwaps.findMany({
    where: eq(batterySwaps.workOrderId, workOrderId),
  });

  if (swaps.length > 0) {
    completed.push({
      id: swaps[0].id,
      type: 'battery_swap',
      submittedAt: swaps[0].recordedAt,
      data: { swapCount: swaps.length },
    });
  }

  // 2. Check for form submissions (maintenance, wind_audit, survey)
  const submissions = await db.query.formSubmissions.findMany({
    where: eq(formSubmissions.workOrderId, workOrderId),
    orderBy: (formSubmissions, { asc }) => [asc(formSubmissions.submittedAt)],
  });

  for (const submission of submissions) {
    completed.push({
      id: submission.id,
      type: submission.formType as 'maintenance' | 'wind_audit' | 'survey',
      submittedAt: submission.submittedAt,
      data: submission.formData,
    });
  }

  // Sort by submission time
  completed.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

  return completed;
}

/**
 * Check if a specific form type has been completed
 *
 * @param workOrderId - Supabase work_orders.id
 * @param formType - Form type to check
 * @returns True if form type has been completed
 */
export async function hasCompletedFormType(
  workOrderId: number,
  formType: 'battery_swap' | 'maintenance' | 'wind_audit' | 'survey'
): Promise<boolean> {
  if (formType === 'battery_swap') {
    const swaps = await db.query.batterySwaps.findFirst({
      where: eq(batterySwaps.workOrderId, workOrderId),
    });
    return !!swaps;
  } else {
    const submission = await db.query.formSubmissions.findFirst({
      where: eq(formSubmissions.workOrderId, workOrderId),
    });
    return !!submission && submission.formType === formType;
  }
}

/**
 * Get available form types based on what's already been completed
 * and form configuration rules
 *
 * @param workOrderId - Supabase work_orders.id
 * @param workType - Work order type from Airtable
 * @returns Array of available form types
 */
export async function getAvailableFormTypes(
  workOrderId: number,
  workType: string
): Promise<Array<'maintenance' | 'wind_audit' | 'survey'>> {
  const completed = await getCompletedForms(workOrderId);
  const available: Array<'maintenance' | 'wind_audit' | 'survey'> = [];

  // Battery swap is standalone - if completed, no other forms allowed
  const hasBatterySwap = completed.some((f) => f.type === 'battery_swap');
  if (hasBatterySwap) {
    return [];
  }

  // Check each form type
  const hasWindAudit = completed.some((f) => f.type === 'wind_audit');
  const hasSurvey = completed.some((f) => f.type === 'survey');

  // Maintenance: always available (repeatable with different categories)
  available.push('maintenance');

  // Wind Audit: only if not already completed (not repeatable)
  if (!hasWindAudit) {
    available.push('wind_audit');
  }

  // Survey: only if not already completed (not repeatable) - but deferred for MVP
  // if (!hasSurvey) {
  //   available.push('survey');
  // }

  return available;
}
