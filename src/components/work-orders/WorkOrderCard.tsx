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
import { Battery, Wrench, Wind, ClipboardList, FileText, User, Home, Clock, Copy } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

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
        icon: Battery,
        label: 'BATTERY SWAP',
        headerColor: 'bg-gray-100',
      };
    case 'maintenance':
      return {
        icon: Wrench,
        label: 'MAINTENANCE',
        headerColor: 'bg-gray-100',
      };
    case 'wind_audit':
      return {
        icon: Wind,
        label: 'WIND AUDIT',
        headerColor: 'bg-gray-100',
      };
    case 'survey':
      return {
        icon: ClipboardList,
        label: 'SURVEY',
        headerColor: 'bg-gray-100',
      };
    default:
      return {
        icon: FileText,
        label: workType.toUpperCase(),
        headerColor: 'bg-gray-100',
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
 * Format step/status text (remove leading numbers and simplify)
 */
function formatStepStatus(step?: string): string {
  if (!step) return '';

  // Remove leading number and dash (e.g., "3-Scheduled " -> "Scheduled")
  const cleaned = step.replace(/^\d+-?\s*/, '').trim();

  // Map to simplified labels (lowercase)
  const lowerCleaned = cleaned.toLowerCase();
  if (lowerCleaned.includes('schedul')) return 'scheduled';
  if (lowerCleaned.includes('progress')) return 'in progress';
  if (lowerCleaned.includes('validat')) return 'validating';
  if (lowerCleaned.includes('done') || lowerCleaned.includes('complet')) return 'completed';

  // Return cleaned version if no mapping found
  return cleaned.toLowerCase();
}

/**
 * Get status circle color based on step number
 */
function getStatusCircleColor(step?: string): string {
  if (!step) return 'bg-gray-400';

  // Extract step number
  const stepNumber = parseInt(step.charAt(0), 10);

  switch (stepNumber) {
    case 3: return 'bg-gray-400';      // Scheduled
    case 4: return 'bg-blue-400';      // In Progress
    case 5: return 'bg-yellow-400';    // Validating
    case 6: return 'bg-green-500';     // Completed
    default: return 'bg-gray-400';
  }
}

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const workTypeInfo = getWorkTypeInfo(workOrder.workType);
  const time = formatTime(workOrder.plannedDate);
  const date = formatDate(workOrder.plannedDate);
  const formattedStatus = formatStepStatus(workOrder.step);
  const statusCircleColor = getStatusCircleColor(workOrder.step);

  const handleCopyAddress = async () => {
    if (!workOrder.fullAddress) return;

    try {
      await navigator.clipboard.writeText(workOrder.fullAddress);
      toast.info(workOrder.fullAddress, {
        description: 'Address copied to clipboard',
      });
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header: Work Type + WO ID + Status */}
      <div className={`${workTypeInfo.headerColor} px-4 py-3 flex items-center gap-3`}>
        <div className="bg-white rounded-lg p-2">
          <workTypeInfo.icon className="w-6 h-6 text-[#EF4A23]" />
        </div>
        <div className="flex-1">
          <div className="text-gray-600 text-xs font-medium">
            {workTypeInfo.label}
          </div>
          <div className="text-gray-900 text-xl font-bold">
            #{workOrder.workOrderId}
          </div>
        </div>
        {formattedStatus && (
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${statusCircleColor}`}></span>
            <span className="text-gray-700 text-sm font-medium">
              {formattedStatus}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Time and Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900">
            <Clock className="w-5 h-5 text-[#EF4A23]" />
            <span className="font-semibold text-lg">{time}</span>
          </div>
          <div className="text-sm text-gray-500">
            {date}
          </div>
        </div>

        <Separator />

        {/* Client */}
        {workOrder.client && (
          <div className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium">{workOrder.client}</span>
          </div>
        )}

        {/* Location */}
        {workOrder.fullAddress && (
          <div className="flex items-center gap-2 text-gray-700">
            <Home className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm truncate flex-1">{workOrder.fullAddress}</span>
            <button
              onClick={handleCopyAddress}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
              title="Copy address"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Reschedule Button - Disabled */}
          <button
            disabled
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 font-semibold rounded-xl cursor-not-allowed"
          >
            Reschedule
          </button>

          {/* Open Job Button - Active */}
          <Link
            href={`/work-order/${workOrder.workOrderId}`}
            className="flex-1"
          >
            <button className="w-full px-4 py-3 bg-[#EF4A23] hover:bg-[#D94420] text-white font-semibold rounded-xl shadow-sm transition-colors">
              Open Job
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
