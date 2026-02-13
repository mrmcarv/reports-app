/**
 * Admin Cleanup Page (Development Only)
 *
 * Provides UI to clean up test data from Supabase
 * URL: http://localhost:3000/admin/cleanup
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CleanupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<any>(null);

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/admin/cleanup');
      const data = await response.json();
      setCounts(data.counts);
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  };

  const handleCleanup = async () => {
    if (
      !confirm(
        '⚠️ This will DELETE ALL work order data from Supabase!\n\nAre you sure?'
      )
    ) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cleanup failed');
      }

      console.log('✅ Cleanup successful:', data);
      setResult(data);

      // Refresh counts
      await fetchCounts();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Cleanup failed:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCounts = () => {
    fetchCounts();
  };

  // Fetch counts on mount
  useState(() => {
    fetchCounts();
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Database Cleanup
          </h1>
          <p className="text-gray-600">
            Development tool to reset work order data for testing
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">
                Destructive Action
              </h3>
              <p className="text-sm text-red-800">
                This will permanently delete all work orders, forms, battery
                swaps, and parts from your Supabase database. Only use in
                development for testing.
              </p>
            </div>
          </div>
        </div>

        {/* Current Counts */}
        {counts && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Current Database State
              </h2>
              <button
                onClick={handleRefreshCounts}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {counts.workOrders}
                </div>
                <div className="text-sm text-gray-600">Work Orders</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {counts.formSubmissions}
                </div>
                <div className="text-sm text-gray-600">Form Submissions</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {counts.batterySwaps}
                </div>
                <div className="text-sm text-gray-600">Battery Swaps</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {counts.partsUsed}
                </div>
                <div className="text-sm text-gray-600">Parts Used</div>
              </div>
            </div>
          </div>
        )}

        {/* Cleanup Button */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Cleanup Actions
          </h2>
          <button
            onClick={handleCleanup}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Cleaning...
              </span>
            ) : (
              '🗑️ Clean Database'
            )}
          </button>
        </div>

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-3">
              ✅ Cleanup Successful
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Work Orders Deleted:</span>
                <span className="font-medium text-green-900">
                  {result.deleted.workOrders}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Form Submissions Deleted:</span>
                <span className="font-medium text-green-900">
                  {result.deleted.formSubmissions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Battery Swaps Deleted:</span>
                <span className="font-medium text-green-900">
                  {result.deleted.batterySwaps}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Parts Deleted:</span>
                <span className="font-medium text-green-900">
                  {result.deleted.partsUsed}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-900 mb-2">❌ Error</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 How to Use</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Check current database state above</li>
            <li>Click "Clean Database" button</li>
            <li>Confirm the destructive action</li>
            <li>Wait for cleanup to complete</li>
            <li>Start fresh testing with clean database</li>
          </ol>
          <p className="mt-3 text-xs text-blue-700">
            Note: This endpoint is only available in development mode.
          </p>
        </div>
      </div>
    </div>
  );
}
