/**
 * Maintenance Form Wrapper
 *
 * Client component wrapper for MaintenanceForm
 * Handles API submission from work order detail page
 */

'use client';

import { MaintenanceForm } from '@/components/forms/MaintenanceForm';
import { useRouter } from 'next/navigation';

interface MaintenanceFormWrapperProps {
  workOrderId: string;
  supabaseWorkOrderId: number;
  onSuccess?: () => void; // Optional callback for multi-form flow
}

export function MaintenanceFormWrapper({
  workOrderId,
  supabaseWorkOrderId,
  onSuccess,
}: MaintenanceFormWrapperProps) {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(
      `/api/work-orders/${supabaseWorkOrderId}/form-submission`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'maintenance',
          formData: data,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit maintenance form');
    }

    const result = await response.json();

    console.log('✅ Maintenance form saved successfully:', result);

    // If onSuccess callback provided (multi-form flow), use it
    if (onSuccess) {
      onSuccess();
    } else {
      // Otherwise, redirect to dashboard (standalone flow)
      router.refresh();
      router.push('/dashboard');
    }
  };

  return <MaintenanceForm workOrderId={workOrderId} onSubmit={handleSubmit} />;
}
