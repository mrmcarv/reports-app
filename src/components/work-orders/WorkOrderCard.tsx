/**
 * Work Order Card Component (Redesigned)
 *
 * Modern card design with:
 * - Colored header with work type icon and WO ID
 * - Time and date display
 * - Client and location info with icons
 * - Status badge
 * - Primary "Open Job" action button
 */

'use client';

import Link from 'next/link';
import { AirtableWorkOrder } from '@/lib/airtable';

interface WorkOrderCardProps {
  workOrder: AirtableWorkOrder;
}

/**
 * Get work type display info (icon, label, header color)
 */
function getWorkTypeInfo(workType: string) {
  switch (workType) {
    case 'battery_swap':
      return {
        icon: '🔋',
        label: 'BATTERY SWAP',
        headerColor: 'bg-blue-600',
      };
    case 'maintenance':
      return {
        icon: '🔧',
        label: 'MAINTENANCE',
        headerColor: 'bg-green-600',
      };
    case 'wind_audit':
      return {
        icon: '🌬️',
        label: 'WIND AUDIT',
        headerColor: 'bg-purple-600',
      };
    case 'survey':
      return {
        icon: '📋',
        label: 'SURVEY',
        headerColor: 'bg-slate-600',
      };
    default:
      return {
        icon: '📄',
        label: workType.toUpperCase(),
        headerColor: 'bg-gray-600',
      };
  }
}

/**
 * Format time from date string (e.g., "02:00 PM")
 */
function formatTime(dateString?: string): string {
  if (!dateString) return '--:--';

  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--:--';
  }
}

/**
 * Format date (e.g., "Feb 13, 2026")
 */
function formatDate(dateString?: string): string {
  if (!dateString) return 'No date';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'No date';
  }
}

/**
 * Get status badge info (color and label)
 */
function getStatusInfo(step?: string, status?: string) {
  // Use step or status for display
  const label = step || status || 'Unknown';

  // Color based on status/step
  if (label.toLowerCase().includes('scheduled')) {
    return { color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' };
  } else if (label.toLowerCase().includes('progress')) {
    return { color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' };
  } else if (label.toLowerCase().includes('complete')) {
    return { color: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
  }

  return { color: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500' };
}

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const workTypeInfo = getWorkTypeInfo(workOrder.workType);
  const time = formatTime(workOrder.plannedDate);
  const date = formatDate(workOrder.plannedDate);
  const statusInfo = getStatusInfo(workOrder.step, workOrder.status);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header: Work Type + WO ID */}
      <div className={`${workTypeInfo.headerColor} px-4 py-3 flex items-center gap-3`}>
        <span className="text-3xl">{workTypeInfo.icon}</span>
        <div className="flex-1">
          <div className="text-white text-xs font-medium opacity-90">
            {workTypeInfo.label}
          </div>
          <div className="text-white text-xl font-bold">
            #{workOrder.workOrderId}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Time and Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-semibold text-lg">{time}</span>
          </div>
          <div className="text-sm text-gray-500">
            {date}
          </div>
        </div>

        {/* Client */}
        {workOrder.client && (
          <div className="flex items-center gap-2 text-gray-700">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-sm font-medium">{workOrder.client}</span>
          </div>
        )}

        {/* Location */}
        {workOrder.pointCode && (
          <div className="flex items-center gap-2 text-gray-700">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-sm">{workOrder.pointCode}</span>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
            {workOrder.step || workOrder.status}
          </span>
        </div>

        {/* Action Button */}
        <Link
          href={`/work-order/${workOrder.workOrderId}`}
          className="block w-full mt-4"
        >
          <button className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors">
            Open Job
          </button>
        </Link>
      </div>
    </div>
  );
}
