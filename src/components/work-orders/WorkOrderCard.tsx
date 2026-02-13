/**
 * Work Order Card Component
 *
 * Displays a single work order with key information:
 * - Work Order ID
 * - Work Type (with icon and color coding)
 * - Client and Location
 * - Planned Date
 * - Initial Issue/Description
 *
 * Clicking the card navigates to the work order detail page
 */

'use client';

import Link from 'next/link';
import { AirtableWorkOrder } from '@/lib/airtable';

interface WorkOrderCardProps {
  workOrder: AirtableWorkOrder;
}

/**
 * Get work type display info (icon, label, color)
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }

    // Otherwise show formatted date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const workTypeInfo = getWorkTypeInfo(workOrder.workType);
  const formattedDate = formatDate(workOrder.plannedDate);

  return (
    <Link
      href={`/work-order/${workOrder.workOrderId}`}
      className="block bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
    >
      <div className="p-4">
        {/* Header: WO ID and Work Type */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {workOrder.workOrderId}
            </h3>
            {workOrder.client && (
              <p className="text-sm text-gray-600 mt-0.5">
                {workOrder.client}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${workTypeInfo.color}`}
          >
            <span className="mr-1">{workTypeInfo.icon}</span>
            {workTypeInfo.label}
          </span>
        </div>

        {/* Location */}
        {workOrder.pointCode && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <svg
              className="w-4 h-4 mr-1.5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="truncate">{workOrder.pointCode}</span>
          </div>
        )}

        {/* Planned Date */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <svg
            className="w-4 h-4 mr-1.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formattedDate}</span>
        </div>

        {/* Initial Issue */}
        {workOrder.initialIssue && (
          <p className="text-sm text-gray-700 line-clamp-2">
            {workOrder.initialIssue}
          </p>
        )}

        {/* Locker Version (if available) */}
        {workOrder.lockerVersion && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Locker: {workOrder.lockerVersion}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
