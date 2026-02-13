/**
 * Battery Swap Form Component
 *
 * Form for completing battery swap work orders.
 * Features:
 * - Multiple battery swap entries (add/remove)
 * - Battery position selector (1, 2, 3)
 * - Old battery serial number (manual or QR scan)
 * - New battery serial number (manual or QR scan)
 * - Optional notes
 * - Photo uploads
 * - Form validation with duplicate position check
 *
 * Note: Battery swap is standalone only for MVP - cannot mix with other forms
 */

'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUpload } from '@/components/FileUpload';
import { QRScanner } from '@/components/QRScanner';

// Single battery swap entry
const batterySwapEntrySchema = z.object({
  batteryPosition: z.enum(['1', '2', '3'], {
    required_error: 'Battery position is required',
  }),
  oldBatterySn: z
    .string()
    .min(1, 'Old battery serial number is required')
    .trim(),
  newBatterySn: z
    .string()
    .min(1, 'New battery serial number is required')
    .trim(),
});

// Full form schema
const batterySwapSchema = z.object({
  swaps: z
    .array(batterySwapEntrySchema)
    .min(1, 'At least one battery swap is required')
    .refine(
      (swaps) => {
        const positions = swaps.map((s) => s.batteryPosition);
        return positions.length === new Set(positions).size;
      },
      {
        message: 'Duplicate battery positions not allowed',
      }
    ),
  notes: z.string().optional(),
  photos: z.array(z.string()).min(1, 'At least one photo is required'),
});

type BatterySwapFormData = z.infer<typeof batterySwapSchema>;

interface BatterySwapFormProps {
  workOrderId: string;
  onSubmit: (data: BatterySwapFormData) => Promise<void>;
  onCancel?: () => void;
}

interface ScanTarget {
  swapIndex: number;
  field: 'oldBatterySn' | 'newBatterySn';
}

export function BatterySwapForm({
  workOrderId,
  onSubmit,
  onCancel,
}: BatterySwapFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [scanTarget, setScanTarget] = useState<ScanTarget | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<BatterySwapFormData>({
    resolver: zodResolver(batterySwapSchema),
    defaultValues: {
      swaps: [{ batteryPosition: undefined, oldBatterySn: '', newBatterySn: '' }],
      notes: '',
      photos: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'swaps',
  });

  /**
   * Handle QR scan result
   */
  const handleQRScan = (result: string) => {
    if (scanTarget) {
      setValue(`swaps.${scanTarget.swapIndex}.${scanTarget.field}`, result, {
        shouldValidate: true,
      });
    }
    setScanTarget(null);
  };

  /**
   * Handle photo uploads
   */
  const handlePhotoUpload = (urls: string[]) => {
    setUploadedPhotos(urls);
    setValue('photos', urls, { shouldValidate: true });
  };

  /**
   * Add new battery swap entry
   */
  const handleAddSwap = () => {
    append({ batteryPosition: undefined, oldBatterySn: '', newBatterySn: '' });
  };

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: BatterySwapFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit form';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Scanner overlay */}
      {scanTarget && (
        <QRScanner
          onScan={handleQRScan}
          onError={(error) => console.error('QR scan error:', error)}
          onClose={() => setScanTarget(null)}
        />
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Battery Swap Entries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Battery Swaps
            </h3>
            <button
              type="button"
              onClick={handleAddSwap}
              disabled={fields.length >= 3}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Battery
            </button>
          </div>

          {/* Show array-level errors */}
          {errors.swaps?.root && (
            <p className="text-sm text-red-600">{errors.swaps.root.message}</p>
          )}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 border border-gray-200 rounded-lg space-y-4 bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">
                  Battery Swap #{index + 1}
                </h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Battery Position */}
              <div>
                <label
                  htmlFor={`swaps.${index}.batteryPosition`}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Battery Position <span className="text-red-500">*</span>
                </label>
                <select
                  id={`swaps.${index}.batteryPosition`}
                  {...register(`swaps.${index}.batteryPosition`)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.swaps?.[index]?.batteryPosition
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Select battery position</option>
                  <option value="1">Battery 1</option>
                  <option value="2">Battery 2</option>
                  <option value="3">Battery 3</option>
                </select>
                {errors.swaps?.[index]?.batteryPosition && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.swaps[index]?.batteryPosition?.message}
                  </p>
                )}
              </div>

              {/* Old Battery SN */}
              <div>
                <label
                  htmlFor={`swaps.${index}.oldBatterySn`}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Old Battery Serial Number{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id={`swaps.${index}.oldBatterySn`}
                    type="text"
                    {...register(`swaps.${index}.oldBatterySn`)}
                    placeholder="Enter or scan serial number"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.swaps?.[index]?.oldBatterySn
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setScanTarget({ swapIndex: index, field: 'oldBatterySn' })
                    }
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </button>
                </div>
                {errors.swaps?.[index]?.oldBatterySn && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.swaps[index]?.oldBatterySn?.message}
                  </p>
                )}
              </div>

              {/* New Battery SN */}
              <div>
                <label
                  htmlFor={`swaps.${index}.newBatterySn`}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New Battery Serial Number{' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id={`swaps.${index}.newBatterySn`}
                    type="text"
                    {...register(`swaps.${index}.newBatterySn`)}
                    placeholder="Enter or scan serial number"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.swaps?.[index]?.newBatterySn
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setScanTarget({ swapIndex: index, field: 'newBatterySn' })
                    }
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </button>
                </div>
                {errors.swaps?.[index]?.newBatterySn && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.swaps[index]?.newBatterySn?.message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Notes (Optional) */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            placeholder="Add any additional notes or observations..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos <span className="text-red-500">*</span>
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={handlePhotoUpload}
            onError={(error) => console.error('Upload error:', error)}
            disabled={isSubmitting}
          />
          {errors.photos && (
            <p className="mt-1 text-sm text-red-600">{errors.photos.message}</p>
          )}
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {submitError}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
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
                Submitting...
              </span>
            ) : (
              `Submit ${fields.length} Battery Swap${fields.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
