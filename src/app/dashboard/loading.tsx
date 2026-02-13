/**
 * Dashboard Loading State
 *
 * Shown while dashboard data is being fetched
 * Uses Next.js automatic loading UI
 */

import { WorkOrderListSkeleton } from '@/components/work-orders/WorkOrderListSkeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bloq.it Reports
              </h1>
              <div className="h-4 w-48 bg-gray-200 rounded mt-1 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assigned Work Orders
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Loading work orders...
            </p>
          </div>
        </div>

        <WorkOrderListSkeleton />
      </main>
    </div>
  );
}
