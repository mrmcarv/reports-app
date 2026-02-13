/**
 * Battery Swap Form Component
 *
 * Form for completing battery swap work orders.
 * Features:
 * - Battery position selector (1, 2, 3)
 * - Old battery serial number (manual or QR scan)
 * - New battery serial number (manual or QR scan)
 * - Photo uploads
 * - Form validation
 *
 * Note: Battery swap is standalone only for MVP - cannot mix with other forms
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUpload } from '@/components/FileUpload';
import { QRScanner } from '@/components/QRScanner';

// Validation schema
const batterySwapSchema = z.object({
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
  photos: z.array(z.string()).min(1, 'At least one photo is required'),
});

type BatterySwapFormData = z.infer<typeof batterySwapSchema>;

interface BatterySwapFormProps {
  workOrderId: string;
  onSubmit: (data: BatterySwapFormData) => Promise<void>;
  onCancel?: () => void;
}

export function BatterySwapForm({
  workOrderId,
  onSubmit,
  onCancel,
}: BatterySwapFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [scanningField, setScanningField] = useState<
    'oldBattery' | 'newBattery' | null
  >(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BatterySwapFormData>({
    resolver: zodResolver(batterySwapSchema),
    defaultValues: {
      batteryPosition: undefined,
      oldBatterySn: '',
      newBatterySn: '',
      photos: [],
    },
  });

  const oldBatterySn = watch('oldBatterySn');
  const newBatterySn = watch('newBatterySn');

  /**
   * Handle QR scan result
   */
  const handleQRScan = (result: string) => {
    if (scanningField === 'oldBattery') {
      setValue('oldBatterySn', result, { shouldValidate: true });
    } else if (scanningField === 'newBattery') {
      setValue('newBatterySn', result, { shouldValidate: true });
    }
    setScanningField(null);
  };

  /**
   * Handle photo uploads
   */
  const handlePhotoUpload = (urls: string[]) => {
    setUploadedPhotos(urls);
    setValue('photos', urls, { shouldValidate: true });
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
      {scanningField && (
        <QRScanner
          onScan={handleQRScan}
          onError={(error) => console.error('QR scan error:', error)}
          onClose={() => setScanningField(null)}
        />
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Battery Position */}
        <div>
          <label
            htmlFor="batteryPosition"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Battery Position <span className="text-red-500">*</span>
          </label>
          <select
            id="batteryPosition"
            {...register('batteryPosition')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.batteryPosition ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select battery position</option>
            <option value="1">Battery 1</option>
            <option value="2">Battery 2</option>
            <option value="3">Battery 3</option>
          </select>
          {errors.batteryPosition && (
            <p className="mt-1 text-sm text-red-600">
              {errors.batteryPosition.message}
            </p>
          )}
        </div>

        {/* Old Battery Serial Number */}
        <div>
          <label
            htmlFor="oldBatterySn"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Old Battery Serial Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="oldBatterySn"
              type="text"
              {...register('oldBatterySn')}
              placeholder="Enter or scan serial number"
              className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.oldBatterySn ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setScanningField('oldBattery')}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
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
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
          {errors.oldBatterySn && (
            <p className="mt-1 text-sm text-red-600">
              {errors.oldBatterySn.message}
            </p>
          )}
          {oldBatterySn && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              <svg
                className="w-4 h-4"
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
              Serial number entered
            </p>
          )}
        </div>

        {/* New Battery Serial Number */}
        <div>
          <label
            htmlFor="newBatterySn"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            New Battery Serial Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="newBatterySn"
              type="text"
              {...register('newBatterySn')}
              placeholder="Enter or scan serial number"
              className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.newBatterySn ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setScanningField('newBattery')}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
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
              <span className="hidden sm:inline">Scan</span>
            </button>
          </div>
          {errors.newBatterySn && (
            <p className="mt-1 text-sm text-red-600">
              {errors.newBatterySn.message}
            </p>
          )}
          {newBatterySn && (
            <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
              <svg
                className="w-4 h-4"
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
              Serial number entered
            </p>
          )}
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
              'Submit Battery Swap'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
