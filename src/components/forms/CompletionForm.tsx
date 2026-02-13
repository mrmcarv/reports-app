/**
 * Completion Form Component
 *
 * Client component that handles work order completion
 * Shows loading, success, and error states with retry option
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CompletionFormProps {
  workOrderId: string; // Airtable WO ID
  supabaseWorkOrderId: number; // Supabase work_orders.id
  isAlreadyCompleted: boolean;
}

type CompletionState =
  | 'idle'
  | 'processing'
  | 'success'
  | 'partial_success'
  | 'error';

export function CompletionForm({
  workOrderId,
  supabaseWorkOrderId,
  isAlreadyCompleted,
}: CompletionFormProps) {
  const router = useRouter();
  const [state, setState] = useState<CompletionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  // Auto-start completion if not already completed
  useEffect(() => {
    if (!isAlreadyCompleted && state === 'idle') {
      handleComplete();
    }
  }, [isAlreadyCompleted, state]);

  const handleComplete = async () => {
    setState('processing');
    setError(null);
    setCanRetry(false);

    try {
      console.log('Completing work order:', workOrderId);

      const response = await fetch(
        `/api/work-orders/${supabaseWorkOrderId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Full success
        console.log('✅ Work order completed successfully:', result);
        toast.success('Work Order Completed!', {
          description: 'All data synced to Airtable successfully',
        });
        setState('success');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else if (response.status === 207) {
        // Partial success: completed but not synced
        console.warn('⚠️ Partial success:', result);
        toast.warning('Partial Success', {
          description: 'Work order completed but sync failed. You can retry.',
        });
        setState('partial_success');
        setError(result.message || 'Failed to sync to Airtable');
        setCanRetry(result.canRetry || false);
      } else {
        // Error
        throw new Error(result.error || 'Failed to complete work order');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Completion failed:', errorMessage);
      toast.error('Completion Failed', {
        description: errorMessage,
      });
      setState('error');
      setError(errorMessage);
      setCanRetry(true);
    }
  };

  const handleRetry = () => {
    handleComplete();
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Processing State */}
      {state === 'processing' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="mb-6">
            <svg
              className="animate-spin h-16 w-16 mx-auto text-blue-600"
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
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Work Order...
          </h2>
          <p className="text-gray-600">
            Finalizing and syncing to Airtable. Please wait.
          </p>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && (
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-green-900 mb-2">
            Work Order Completed!
          </h2>
          <p className="text-green-700 mb-4">
            All data has been saved and synced to Airtable successfully.
          </p>
          <p className="text-sm text-gray-600">
            Redirecting to dashboard...
          </p>
        </div>
      )}

      {/* Partial Success State (Completed but not synced) */}
      {state === 'partial_success' && (
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-8">
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-yellow-600"
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
            </div>
          </div>
          <h2 className="text-xl font-semibold text-yellow-900 mb-2 text-center">
            Partial Success
          </h2>
          <p className="text-yellow-800 mb-4 text-center">
            Work order completed locally, but sync to Airtable failed.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {canRetry && (
              <button
                onClick={handleRetry}
                className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md transition"
              >
                Retry Sync
              </button>
            )}
            <button
              onClick={handleGoToDashboard}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition"
            >
              Go to Dashboard
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-4 text-center">
            Your work has been saved locally. You can retry syncing later.
          </p>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-red-900 mb-2 text-center">
            Completion Failed
          </h2>
          <p className="text-red-700 mb-4 text-center">
            Failed to complete work order. Please try again.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {canRetry && (
              <button
                onClick={handleRetry}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition"
              >
                Try Again
              </button>
            )}
            <button
              onClick={() => router.push(`/work-order/${workOrderId}`)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition"
            >
              Back to Work Order
            </button>
          </div>
        </div>
      )}

      {/* Idle State (Manual trigger) */}
      {state === 'idle' && isAlreadyCompleted && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Complete Work Order
          </h2>
          <p className="text-gray-600 mb-6">
            Ready to finalize and sync to Airtable.
          </p>
          <button
            onClick={handleComplete}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition"
          >
            Complete Work Order
          </button>
        </div>
      )}
    </div>
  );
}
