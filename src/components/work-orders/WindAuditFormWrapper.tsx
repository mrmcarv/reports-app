/**
 * Wind Audit Form Wrapper
 *
 * Client component that wraps WindAuditForm and handles submission
 * Submits to API route, refreshes page on success
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { WindAuditForm } from '@/components/forms/WindAuditForm';

interface WindAuditFormWrapperProps {
  workOrderId: string;
  supabaseWorkOrderId: number;
  onSuccess?: () => void; // Optional callback for multi-form flow
}

export function WindAuditFormWrapper({
  workOrderId,
  supabaseWorkOrderId,
  onSuccess,
}: WindAuditFormWrapperProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Submitting wind audit form data:', data);

      const response = await fetch(
        `/api/work-orders/${supabaseWorkOrderId}/form-submission`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formType: 'wind_audit',
            formData: data,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit wind audit form');
      }

      console.log('Wind audit form submitted successfully:', result);
      toast.success('Wind Audit Saved', {
        description: 'Form submitted successfully',
      });

      // If onSuccess callback provided (multi-form flow), use it
      if (onSuccess) {
        onSuccess();
      } else {
        // Otherwise, redirect to dashboard (standalone flow)
        router.refresh();
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to submit wind audit form:', errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <WindAuditForm
        workOrderId={workOrderId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
