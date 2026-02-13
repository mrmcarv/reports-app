/**
 * Admin Cleanup Page (Development Only)
 *
 * Provides UI to clean up test data from Supabase
 * Restricted to admin users only
 * URL: http://localhost:3000/admin/cleanup
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkAdmin } from '@/lib/admin';
import { CleanupUI } from '@/components/admin/CleanupUI';

export default async function CleanupPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin access
  const adminCheck = checkAdmin(user);

  // If not admin, show access denied
  if (!adminCheck.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-4">
              This page is restricted to admin users only.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <p className="text-sm text-red-800">{adminCheck.reason}</p>
            </div>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User is admin - show cleanup UI
  return <CleanupUI userEmail={user.email || 'Unknown'} />;
}
