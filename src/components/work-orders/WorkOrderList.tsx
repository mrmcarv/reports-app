/**
 * Work Order List Component
 *
 * Displays today's work orders (includes overdue) with status filtering:
 * - All (default)
 * - Scheduled
 * - In Progress/Validating
 * - Completed
 *
 * Overdue items shown with orange border
 */

'use client';

import { useState, useMemo } from 'react';
import { AirtableWorkOrder } from '@/lib/airtable';
import { WorkOrderCard } from './WorkOrderCard';

interface WorkOrderListProps {
  workOrders: {
    today: AirtableWorkOrder[];
    upcoming: AirtableWorkOrder[];
    overdue: AirtableWorkOrder[];
  };
}

type StatusFilter = 'scheduled' | 'in-progress' | 'completed';

/**
 * Helper to determine if work order is overdue
 */
function isOverdue(workOrder: AirtableWorkOrder, overdueList: AirtableWorkOrder[]): boolean {
  return overdueList.some(wo => wo.id === workOrder.id);
}

/**
 * Helper to check if work order matches status filter
 */
function matchesStatusFilter(workOrder: AirtableWorkOrder, filter: StatusFilter): boolean {
  const step = workOrder.step || '';
  const stepNumber = parseInt(step.charAt(0), 10);

  switch (filter) {
    case 'scheduled':
      return stepNumber === 3;
    case 'in-progress':
      return stepNumber === 4 || stepNumber === 5; // In Progress or Validating
    case 'completed':
      return stepNumber === 6;
    default:
      return false;
  }
}

export function WorkOrderList({ workOrders }: WorkOrderListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('scheduled');

  // Today's work orders include overdue items
  const todayWorkOrders = [...workOrders.overdue, ...workOrders.today];
  const totalCount = todayWorkOrders.length;

  // Calculate counts for each status
  const statusCounts = useMemo(() => {
    return {
      scheduled: todayWorkOrders.filter(wo => matchesStatusFilter(wo, 'scheduled')).length,
      inProgress: todayWorkOrders.filter(wo => matchesStatusFilter(wo, 'in-progress')).length,
      completed: todayWorkOrders.filter(wo => matchesStatusFilter(wo, 'completed')).length,
    };
  }, [todayWorkOrders]);

  // Filter work orders by status
  const filteredWorkOrders = useMemo(() => {
    return todayWorkOrders.filter(wo => matchesStatusFilter(wo, statusFilter));
  }, [statusFilter, todayWorkOrders]);

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
    <div className="space-y-6">
      {/* Status Filter Pills */}
      <div className="flex items-center gap-3 w-full">
        <button
          onClick={() => setStatusFilter('scheduled')}
          className={`flex-1 flex flex-col items-center justify-center px-6 py-3 rounded-2xl transition-colors ${
            statusFilter === 'scheduled'
              ? 'bg-orange-100 text-orange-900'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span className="text-2xl font-bold">{statusCounts.scheduled}</span>
          <span className="text-xs font-medium mt-1">To Do</span>
        </button>

        <button
          onClick={() => setStatusFilter('in-progress')}
          className={`flex-1 flex flex-col items-center justify-center px-6 py-3 rounded-2xl transition-colors ${
            statusFilter === 'in-progress'
              ? 'bg-orange-100 text-orange-900'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span className="text-2xl font-bold">{statusCounts.inProgress}</span>
          <span className="text-xs font-medium mt-1">In Progress</span>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`flex-1 flex flex-col items-center justify-center px-6 py-3 rounded-2xl transition-colors ${
            statusFilter === 'completed'
              ? 'bg-orange-100 text-orange-900'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          <span className="text-2xl font-bold">{statusCounts.completed}</span>
          <span className="text-xs font-medium mt-1">Done</span>
        </button>
      </div>

      {/* Work Order Cards */}
      {filteredWorkOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No work orders match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredWorkOrders.map((workOrder) => (
            <WorkOrderCard
              key={workOrder.id}
              workOrder={workOrder}
              isOverdue={isOverdue(workOrder, workOrders.overdue)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
