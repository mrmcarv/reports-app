/**
 * Maintenance Form Test Page
 *
 * Test page for the Maintenance Form component
 * Tests: All 4 sections, photo uploads, form validation, submission
 *
 * URL: /test/maintenance
 */

'use client';

import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { useState } from 'react';
import Link from 'next/link';

export default function MaintenanceTestPage() {
  const [submittedData, setSubmittedData] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    console.log('Maintenance form submitted:', data);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmittedData(data);

    alert('Maintenance form submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
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
                Maintenance Form Test
              </h1>
              <p className="text-sm text-gray-600">
                Test all sections, photo uploads, and form validation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <MaintenanceForm
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
                <span className="font-medium">Category:</span>{' '}
                {submittedData.reportingCategory}
              </div>
              <div>
                <span className="font-medium">Issue Type:</span>{' '}
                {submittedData.issueType}
              </div>
              <div>
                <span className="font-medium">Before Photos:</span>{' '}
                {submittedData.beforePhotos.length}
              </div>
              <div>
                <span className="font-medium">Work Photos:</span>{' '}
                {submittedData.workPhotos?.length || 0}
              </div>
              <div>
                <span className="font-medium">After Photos:</span>{' '}
                {submittedData.afterPhotos.length}
              </div>
              <div>
                <span className="font-medium">Resolution:</span>{' '}
                {submittedData.issueResolved}
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
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <p className="font-medium mb-2">Section 1: Issue Identification</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Select a reporting category</li>
                <li>Describe the issue (10+ chars)</li>
                <li>Select severity level</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Section 2: Initial Assessment</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Upload at least 1 before photo</li>
                <li>Confirm if issue matches description</li>
                <li>Explain root cause (10+ chars)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Section 3: Work Performed</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check at least 1 action taken</li>
                <li>Describe work performed (20+ chars)</li>
                <li>Upload work photos (optional)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Section 4: Completion</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Upload at least 1 after photo</li>
                <li>Select resolution status</li>
                <li>Describe testing performed (10+ chars)</li>
                <li>Indicate if additional issues found</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
