/**
 * Battery Swap Form Wrapper
 *
 * Client component wrapper for BatterySwapForm
 * Handles API submission from work order detail page
 */

'use client';

import { BatterySwapForm } from '@/components/forms/BatterySwapForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface BatterySwapFormWrapperProps {
  workOrderId: string;
  supabaseWorkOrderId: number;
}

export function BatterySwapFormWrapper({
  workOrderId,
  supabaseWorkOrderId,
}: BatterySwapFormWrapperProps) {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(
      `/api/work-orders/${supabaseWorkOrderId}/battery-swaps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit battery swaps');
    }

    const result = await response.json();

    toast.success('Battery Swap Completed', {
      description: `${result.batterySwaps.length} battery swap(s) saved successfully`,
      duration: Infinity,
    });

    // Refresh to show completed state
    router.refresh();
    // Optionally redirect to dashboard
    router.push('/dashboard');
  };

  return <BatterySwapForm workOrderId={workOrderId} onSubmit={handleSubmit} />;
}
