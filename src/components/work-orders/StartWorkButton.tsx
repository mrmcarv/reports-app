/**
 * Start Work Button Component
 *
 * Initializes a work order in Supabase when clicked
 * Shows loading and success/error states
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface StartWorkButtonProps {
  workOrderId: string;
}

export function StartWorkButton({ workOrderId }: StartWorkButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/work-orders/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workOrderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize work order');
      }

      console.log('✅ Work order initialized:', data);

      // Refresh page to show updated state (form will appear)
      router.refresh();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Failed to start work order:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleStart}
        disabled={isLoading}
        className={`w-full sm:w-auto px-6 py-3 font-medium rounded-md transition ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
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
            Initializing...
          </span>
        ) : (
          'Start Work Order'
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
          <button
            onClick={handleStart}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
