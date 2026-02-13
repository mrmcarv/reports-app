/**
 * Parts Tracking Page
 *
 * Allows technician to record parts used for each completed form
 * Shows only forms that require parts tracking (maintenance, wind_audit)
 * Consolidated at the end before final work order completion
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { workOrders } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getCompletedForms } from '@/lib/workOrderHelpers';
import { PartsTrackingForm } from '@/components/forms/PartsTrackingForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Get form type display info
 */
function getFormTypeInfo(type: string) {
  switch (type) {
    case 'maintenance':
      return { icon: '🔧', label: 'Maintenance' };
    case 'wind_audit':
      return { icon: '🌬️', label: 'Wind Audit' };
    case 'survey':
      return { icon: '📋', label: 'Survey' };
    default:
      return { icon: '📄', label: type };
  }
}

/**
 * Check if form type requires parts tracking
 */
function requiresPartsTracking(type: string): boolean {
  return ['maintenance', 'wind_audit'].includes(type);
}

export default async function PartsTrackingPage({ params }: PageProps) {
  // Await params (Next.js 15+ requirement)
  const { id } = await params;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get work order from Supabase
  const workOrder = await db.query.workOrders.findFirst({
    where: and(
      eq(workOrders.workOrderId, id),
      eq(workOrders.technicianUserId, user.id)
    ),
  });

  if (!workOrder) {
    notFound();
  }

  // Fetch completed forms
  const completedForms = await getCompletedForms(workOrder.id);

  // Filter to only forms that require parts tracking
  const formsRequiringParts = completedForms.filter((form) =>
    requiresPartsTracking(form.type)
  );

  console.log('Parts Tracking Debug:', {
    workOrderId: id,
    completedFormsCount: completedForms.length,
    formsRequiringPartsCount: formsRequiringParts.length,
    forms: formsRequiringParts.map((f) => ({
      type: f.type,
      id: f.id,
    })),
  });

  // Prepare forms data for the client component
  const formsData = formsRequiringParts.map((form) => ({
    id: form.id,
    type: form.type,
    ...getFormTypeInfo(form.type),
    category: form.data?.reportingCategory, // For maintenance forms
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/work-order/${id}`}
              className="p-2 hover:bg-gray-100 rounded-md transition"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Parts Tracking
              </h1>
              <p className="text-sm text-gray-600">
                Record parts used for each intervention
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {formsRequiringParts.length === 0 ? (
          /* No forms require parts */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600 mb-4">
              None of the completed interventions require parts tracking.
            </p>
            <Link
              href={`/work-order/${id}/complete`}
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition"
            >
              Continue to Completion
            </Link>
          </div>
        ) : (
          /* Show parts tracking form */
          <PartsTrackingForm
            workOrderId={id}
            supabaseWorkOrderId={workOrder.id}
            forms={formsData}
          />
        )}
      </main>
    </div>
  );
}
