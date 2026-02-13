/**
 * Dashboard Page
 *
 * Displays assigned work orders for the logged-in technician.
 * Groups work orders by date (Today, Upcoming, Overdue).
 *
 * Data flow:
 * 1. Check authentication
 * 2. Fetch work orders from API route (mock or Airtable)
 * 3. Display in WorkOrderList component with grouping
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkOrderList } from '@/components/work-orders/WorkOrderList';
import {
  fetchWorkOrdersForTechnician,
  groupWorkOrdersByDate,
} from '@/lib/airtable';
import { USE_MOCK_DATA, getMockWorkOrders } from '@/lib/mockData';

async function getWorkOrders(technicianEmail: string) {
  try {
    // Fetch work orders (mock or Airtable)
    let workOrders;
    if (USE_MOCK_DATA) {
      console.log('🎭 Using mock data for development');
      workOrders = await getMockWorkOrders();
    } else {
      console.log('🔗 Fetching from Airtable');
      workOrders = await fetchWorkOrdersForTechnician(technicianEmail);
    }

    // Group by date
    const grouped = groupWorkOrdersByDate(workOrders);
    return grouped;
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return { today: [], upcoming: [], overdue: [] };
  }
}

export default async function DashboardPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch work orders
  const workOrders = await getWorkOrders(user.email!);

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

        {/* Work order list */}
        <WorkOrderList workOrders={workOrders} />
      </main>
    </div>
  );
}
