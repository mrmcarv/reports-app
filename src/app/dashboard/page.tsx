/**
 * Dashboard Page
 *
 * Displays assigned work orders for the logged-in technician.
 * Groups work orders by date (Today, Upcoming, Overdue).
 *
 * Data flow:
 * 1. Fetch work orders from Airtable (via API route)
 * 2. Filter by logged-in technician's email
 * 3. Sort by planned date
 * 4. Display in WorkOrderList component
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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
              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Assigned Work Orders
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Work orders scheduled for completion
          </p>
        </div>

        {/* Work order list placeholder */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
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
              Work Orders Loading...
            </h3>
            <p className="text-sm text-gray-500">
              Fetching your assigned work orders from Airtable
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
