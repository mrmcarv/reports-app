/**
 * Work Order Completion Page
 *
 * Final step: Complete work order and sync to Airtable
 * Shows success/error states with retry option
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { workOrders } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { CompletionForm } from '@/components/forms/CompletionForm';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompletionPage({ params }: PageProps) {
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

  // If already completed and synced, redirect to dashboard
  if (workOrder.status === 'completed' && workOrder.syncedToAirtable) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                Complete Work Order
              </h1>
              <p className="text-sm text-gray-600">{id}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CompletionForm
          workOrderId={id}
          supabaseWorkOrderId={workOrder.id}
          isAlreadyCompleted={workOrder.status === 'completed'}
        />
      </main>
    </div>
  );
}
