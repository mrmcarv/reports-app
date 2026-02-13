/**
 * Battery Swap Form Test Page
 *
 * Test page for the Battery Swap Form component
 * Tests: QR scanner, file upload, form validation, submission
 *
 * URL: /test/battery-swap
 */

'use client';

import { BatterySwapForm } from '@/components/forms/BatterySwapForm';
import { useState } from 'react';
import Link from 'next/link';

export default function BatterySwapTestPage() {
  const [submittedData, setSubmittedData] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    console.log('Form submitted:', data);

    // Call API
    const response = await fetch('/api/work-orders/88460/battery-swaps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit battery swaps');
    }

    const result = await response.json();
    setSubmittedData(result);

    alert(
      `✅ ${result.batterySwaps.length} battery swap(s) saved successfully!\nWork order completed.`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-md transition"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Battery Swap Form Test
              </h1>
              <p className="text-sm text-gray-600">
                Test QR scanning, file uploads, and form validation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <BatterySwapForm
            workOrderId="88460"
            onSubmit={handleSubmit}
            onCancel={() => alert('Form cancelled')}
          />
        </div>

        {/* Submitted data display */}
        {submittedData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-4">
              Form Submitted Successfully!
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Battery Position:</span>{' '}
                {submittedData.batteryPosition}
              </div>
              <div>
                <span className="font-medium">Old Battery SN:</span>{' '}
                {submittedData.oldBatterySn}
              </div>
              <div>
                <span className="font-medium">New Battery SN:</span>{' '}
                {submittedData.newBatterySn}
              </div>
              <div>
                <span className="font-medium">Photos:</span>{' '}
                {submittedData.photos.length} uploaded
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setSubmittedData(null)}
                className="text-sm text-green-700 hover:text-green-900 underline"
              >
                Submit another
              </button>
            </div>
          </div>
        )}

        {/* Test instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">Testing Guide</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-2">
              <span>1.</span>
              <span>
                Select battery position from dropdown (Battery 1, 2, or 3)
              </span>
            </li>
            <li className="flex gap-2">
              <span>2.</span>
              <span>
                Test QR scanner by clicking "Scan" button for serial numbers
              </span>
            </li>
            <li className="flex gap-2">
              <span>3.</span>
              <span>Or manually type serial numbers if no QR code available</span>
            </li>
            <li className="flex gap-2">
              <span>4.</span>
              <span>
                Upload photos using camera or gallery (at least 1 required)
              </span>
            </li>
            <li className="flex gap-2">
              <span>5.</span>
              <span>Click "Submit Battery Swap" to test validation</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
