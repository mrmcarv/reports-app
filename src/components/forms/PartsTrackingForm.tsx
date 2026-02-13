/**
 * Parts Tracking Form Component
 *
 * Client component that manages parts input for all completed forms
 * Submits parts data to API and navigates to completion
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FormPartsSection } from '@/components/parts/FormPartsSection';

interface Part {
  id: string;
  partName: string;
  quantity: number;
}

interface FormData {
  id: number;
  type: string;
  icon: string;
  label: string;
  category?: string;
}

interface PartsTrackingFormProps {
  workOrderId: string; // Airtable WO ID
  supabaseWorkOrderId: number; // Supabase work_orders.id
  forms: FormData[];
}

export function PartsTrackingForm({
  workOrderId,
  supabaseWorkOrderId,
  forms,
}: PartsTrackingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track parts for each form
  const [formsParts, setFormsParts] = useState<Record<number, Part[]>>(
    forms.reduce((acc, form) => {
      acc[form.id] = [{ id: crypto.randomUUID(), partName: '', quantity: 1 }];
      return acc;
    }, {} as Record<number, Part[]>)
  );

  const handleFormPartsChange = (formId: number, parts: Part[]) => {
    setFormsParts((prev) => ({
      ...prev,
      [formId]: parts,
    }));
  };

  const handleSkip = () => {
    // Skip parts tracking and go directly to completion
    router.push(`/work-order/${workOrderId}/complete`);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare parts data - only include parts with names
      const partsData = Object.entries(formsParts).flatMap(
        ([formId, parts]) =>
          parts
            .filter((part) => part.partName.trim() !== '')
            .map((part) => ({
              formSubmissionId: parseInt(formId, 10),
              partName: part.partName.trim(),
              quantity: part.quantity,
            }))
      );

      console.log('Submitting parts:', partsData);

      // If no parts entered, skip to completion
      if (partsData.length === 0) {
        router.push(`/work-order/${workOrderId}/complete`);
        return;
      }

      // Submit parts to API
      const response = await fetch(
        `/api/work-orders/${supabaseWorkOrderId}/parts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parts: partsData }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save parts');
      }

      console.log('Parts saved successfully:', result);
      toast.success('Parts Saved', {
        description: `${partsData.length} part(s) recorded successfully`,
        action: {
          label: 'OK',
          onClick: () => {},
        },
      });

      // Navigate to completion
      router.push(`/work-order/${workOrderId}/complete`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to save parts:', errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Record Parts Used
        </h2>
        <p className="text-sm text-gray-600">
          For each intervention below, record the parts you used. You can skip
          this step if no parts were needed.
        </p>
      </div>

      {/* Forms with Parts Sections */}
      <div className="space-y-4">
        {forms.map((form) => (
          <FormPartsSection
            key={form.id}
            formId={form.id}
            formType={form.type}
            formLabel={form.label}
            formIcon={form.icon}
            category={form.category}
            initialParts={formsParts[form.id]}
            onChange={(parts) => handleFormPartsChange(form.id, parts)}
            disabled={isSubmitting}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip - No Parts Used
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
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
                Saving...
              </span>
            ) : (
              'Continue with Parts'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
