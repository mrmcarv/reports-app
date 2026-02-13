/**
 * Work Order Detail Page
 *
 * Shows full details of a specific work order and allows technician to:
 * 1. View all work order information
 * 2. Start working on the work order
 * 3. Complete forms (battery swap, maintenance, wind audit)
 * 4. Upload photos and track parts
 * 5. Submit completion
 *
 * URL: /work-order/[workOrderId]
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  fetchWorkOrderById,
  AirtableWorkOrder,
} from '@/lib/airtable';
import { USE_MOCK_DATA, MOCK_WORK_ORDERS } from '@/lib/mockData';
import { StartWorkButton } from '@/components/work-orders/StartWorkButton';
import { db } from '@/lib/db';
import { workOrders } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { BatterySwapFormWrapper } from '@/components/work-orders/BatterySwapFormWrapper';
import { MaintenanceFormWrapper } from '@/components/work-orders/MaintenanceFormWrapper';
import { WindAuditFormWrapper } from '@/components/work-orders/WindAuditFormWrapper';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Get work order by ID (mock or Airtable)
 */
async function getWorkOrder(
  workOrderId: string
): Promise<AirtableWorkOrder | null> {
  try {
    if (USE_MOCK_DATA) {
      console.log('🎭 Using mock data for work order:', workOrderId);
      const workOrder = MOCK_WORK_ORDERS.find(
        (wo) => wo.workOrderId === workOrderId
      );
      return workOrder || null;
    } else {
      console.log('🔗 Fetching from Airtable:', workOrderId);
      return await fetchWorkOrderById(workOrderId);
    }
  } catch (error) {
    console.error('Error fetching work order:', error);
    return null;
  }
}

/**
 * Get work type display info
 */
function getWorkTypeInfo(workType: string) {
  switch (workType) {
    case 'battery_swap':
      return {
        icon: '🔋',
        label: 'Battery Swap',
        color: 'bg-blue-100 text-blue-800',
      };
    case 'maintenance':
      return {
        icon: '🔧',
        label: 'Maintenance',
        color: 'bg-green-100 text-green-800',
      };
    case 'wind_audit':
      return {
        icon: '🌬️',
        label: 'Wind Audit',
        color: 'bg-purple-100 text-purple-800',
      };
    case 'survey':
      return {
        icon: '📋',
        label: 'Survey',
        color: 'bg-orange-100 text-orange-800',
      };
    default:
      return {
        icon: '📄',
        label: workType,
        color: 'bg-gray-100 text-gray-800',
      };
  }
}

/**
 * Format date for display
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'No date';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default async function WorkOrderPage({ params }: PageProps) {
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

  // Fetch work order from Airtable/mock
  const workOrder = await getWorkOrder(id);

  if (!workOrder) {
    notFound();
  }

  // Check if work order has been initialized in Supabase
  const supabaseWorkOrder = await db.query.workOrders.findFirst({
    where: and(
      eq(workOrders.workOrderId, id),
      eq(workOrders.technicianUserId, user.id)
    ),
  });

  const isInitialized = !!supabaseWorkOrder;
  const isCompleted = supabaseWorkOrder?.status === 'completed';

  // Debug logging
  console.log('Work Order Debug:', {
    workOrderId: id,
    workType: workOrder.workType,
    isInitialized,
    isCompleted,
    supabaseWorkOrderId: supabaseWorkOrder?.id,
  });

  const workTypeInfo = getWorkTypeInfo(workOrder.workType);
  const formattedDate = formatDate(workOrder.plannedDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
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
                {workOrder.workOrderId}
              </h1>
              <p className="text-sm text-gray-600">{workOrder.client}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Work Type Badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${workTypeInfo.color}`}
          >
            <span className="text-lg mr-2">{workTypeInfo.icon}</span>
            {workTypeInfo.label}
          </span>
        </div>

        {/* Work Order Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Work Order Details
          </h2>

          <dl className="space-y-4">
            {/* Planned Date */}
            <div>
              <dt className="text-sm font-medium text-gray-500">
                Planned Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formattedDate}</dd>
            </div>

            {/* Client */}
            {workOrder.client && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Client</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workOrder.client}
                </dd>
              </div>
            )}

            {/* Location */}
            {workOrder.pointCode && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workOrder.pointCode}
                </dd>
              </div>
            )}

            {/* Locker Version */}
            {workOrder.lockerVersion && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Locker Version
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {workOrder.lockerVersion}
                </dd>
              </div>
            )}

            {/* Initial Issue */}
            {workOrder.initialIssue && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Initial Issue
                </dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {workOrder.initialIssue}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Conditional: Start Button or Form */}
        {!isInitialized ? (
          /* Not yet started - show start button */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ready to Start?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Begin working on this work order. You'll be able to fill out
              forms, upload photos, and track parts used.
            </p>
            <StartWorkButton workOrderId={workOrder.workOrderId} />
            <p className="text-xs text-gray-500 mt-4">
              This will initialize the work order in the system and allow you to
              complete forms.
            </p>
          </div>
        ) : isCompleted ? (
          /* Already completed */
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ✅ Work Order Completed
            </h3>
            <p className="text-sm text-green-700">
              This work order has been completed and submitted.
            </p>
          </div>
        ) : (
          /* In progress - show appropriate form based on work type */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {workOrder.workType === 'battery_swap' && 'Complete Battery Swap'}
              {workOrder.workType === 'maintenance' && 'Complete Maintenance'}
              {workOrder.workType === 'wind_audit' && 'Complete Wind Audit'}
              {workOrder.workType === 'survey' && 'Complete Survey'}
            </h3>

            {workOrder.workType === 'battery_swap' && (
              <BatterySwapFormWrapper
                workOrderId={workOrder.workOrderId}
                supabaseWorkOrderId={supabaseWorkOrder!.id}
              />
            )}

            {workOrder.workType === 'maintenance' && (
              <MaintenanceFormWrapper
                workOrderId={workOrder.workOrderId}
                supabaseWorkOrderId={supabaseWorkOrder!.id}
              />
            )}

            {workOrder.workType === 'wind_audit' && (
              <WindAuditFormWrapper
                workOrderId={workOrder.workOrderId}
                supabaseWorkOrderId={supabaseWorkOrder!.id}
              />
            )}

            {workOrder.workType === 'survey' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Survey form coming soon...
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
