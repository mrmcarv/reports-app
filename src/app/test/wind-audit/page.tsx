/**
 * Wind Audit Form Test Page
 *
 * Quick test page for Wind Audit form development
 * Uses a real work order ID for testing
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WindAuditFormWrapper } from '@/components/work-orders/WindAuditFormWrapper';

export default async function TestWindAuditPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use a real wind audit work order ID for testing
  // Change this to an actual wind audit work order ID from Airtable
  const TEST_WORK_ORDER_ID = '88460'; // Replace with actual wind audit WO ID
  const TEST_SUPABASE_WO_ID = 1; // Replace with actual Supabase work_orders.id

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wind Audit Form Test
          </h1>
          <p className="text-sm text-gray-600">
            Testing: WO {TEST_WORK_ORDER_ID} (Supabase ID: {TEST_SUPABASE_WO_ID})
          </p>
          <p className="text-xs text-red-600 mt-2">
            ⚠️ Update TEST_WORK_ORDER_ID and TEST_SUPABASE_WO_ID with real values
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <WindAuditFormWrapper
            workOrderId={TEST_WORK_ORDER_ID}
            supabaseWorkOrderId={TEST_SUPABASE_WO_ID}
          />
        </div>
      </div>
    </div>
  );
}
