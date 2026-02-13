/**
 * Refresh Button Component
 *
 * Allows users to manually refresh data (work orders, etc.)
 * Uses Next.js router.refresh() to re-fetch server data
 *
 * Shows loading state during refresh
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RefreshButtonProps {
  label?: string;
  className?: string;
}

export function RefreshButton({
  label = 'Refresh',
  className = '',
}: RefreshButtonProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh(); // Re-fetch server data

    // Reset loading state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition ${
        isRefreshing
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
      } ${className}`}
      aria-label="Refresh data"
    >
      <svg
        className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {isRefreshing ? 'Refreshing...' : label}
    </button>
  );
}
