/**
 * Work Order List Component
 *
 * Displays work orders grouped by date category:
 * - Overdue (red badge)
 * - Today (blue badge)
 * - Upcoming (gray badge)
 *
 * Shows empty state if no work orders in a category
 */

'use client';

import { AirtableWorkOrder } from '@/lib/airtable';
import { WorkOrderCard } from './WorkOrderCard';

interface WorkOrderListProps {
  workOrders: {
    today: AirtableWorkOrder[];
    upcoming: AirtableWorkOrder[];
    overdue: AirtableWorkOrder[];
  };
}

interface SectionProps {
  title: string;
  count: number;
  workOrders: AirtableWorkOrder[];
  badgeColor: string;
  emptyMessage: string;
}

function WorkOrderSection({
  title,
  count,
  workOrders,
  badgeColor,
  emptyMessage,
}: SectionProps) {
  if (workOrders.length === 0) {
    return null; // Don't show empty sections
  }

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}
        >
          {count}
        </span>
      </div>

      {/* Work Order Cards */}
      <div className="space-y-6">
        {workOrders.map((workOrder) => (
          <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
        ))}
      </div>
    </div>
  );
}

export function WorkOrderList({ workOrders }: WorkOrderListProps) {
  const totalCount =
    workOrders.today.length +
    workOrders.upcoming.length +
    workOrders.overdue.length;

  // Empty state
  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No Work Orders
          </h3>
          <p className="text-sm text-gray-500">
            You don't have any work orders assigned at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Overdue Section (highest priority) */}
      <WorkOrderSection
        title="Overdue"
        count={workOrders.overdue.length}
        workOrders={workOrders.overdue}
        badgeColor="bg-red-100 text-red-800"
        emptyMessage="No overdue work orders"
      />

      {/* Today Section */}
      <WorkOrderSection
        title="Today"
        count={workOrders.today.length}
        workOrders={workOrders.today}
        badgeColor="bg-blue-100 text-blue-800"
        emptyMessage="No work orders scheduled for today"
      />

      {/* Upcoming Section */}
      <WorkOrderSection
        title="Upcoming"
        count={workOrders.upcoming.length}
        workOrders={workOrders.upcoming}
        badgeColor="bg-gray-100 text-gray-800"
        emptyMessage="No upcoming work orders"
      />
    </div>
  );
}
