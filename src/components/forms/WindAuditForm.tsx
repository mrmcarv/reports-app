/**
 * Wind Audit Form Component
 *
 * Comprehensive wind audit form with 6 sections.
 * Based on Fillout "NEW Wind Audit - V1" configuration.
 *
 * Sections:
 * 1. Site Check (collapsible)
 * 2. Wind Audit
 * 3. Locker Before
 * 4. Locker Test
 * 5. Ground & Plexo Test
 * 6. Completion
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUpload } from '@/components/FileUpload';

// Validation schema
const windAuditSchema = z.object({
  // Site Check
  siteAccessible: z.enum(['yes', 'no'], 'Required'),
  siteCondition: z.string().min(1, 'Site condition is required'),
  siteIssues: z.string().optional(),
  sitePhotos: z.array(z.string()).optional(),

  // Wind Audit
  windConditions: z.enum(['calm', 'light', 'moderate', 'strong'], 'Wind conditions required'),
  windNotes: z.string().optional(),
  environmentalIssues: z.enum(['yes', 'no'], 'Required'),
  environmentalIssuesDescription: z.string().optional(),
  windAuditPhotos: z.array(z.string()).min(1, 'At least one photo required'),
  windAuditPhotos2: z.array(z.string()).optional(),
  windAuditPhotos3: z.array(z.string()).optional(),

  // Locker Before
  lockerBeforePhotos: z.array(z.string()).min(1, 'At least one photo required'),
  batteryVoltage: z.string().optional(),
  batteryPercentage: z.string().optional(),
  lockerBeforePhotos2: z.array(z.string()).optional(),
  screenWorking: z.enum(['yes', 'no'], 'Required'),
  lockerBeforePhotos3: z.array(z.string()).optional(),

  // Locker Test
  lockerTestPhotos: z.array(z.string()).min(1, 'At least one photo required'),
  compartmentsWorking: z.enum(['all', 'some', 'none'], 'Required'),
  compartmentIssues: z.string().optional(),
  lockerTestPhotos2: z.array(z.string()).optional(),
  printerWorking: z.enum(['yes', 'no'], 'Required'),
  lockerTestPhotos3: z.array(z.string()).optional(),
  lockerTestPhotos4: z.array(z.string()).optional(),
  lockerTestPhotos5: z.array(z.string()).optional(),
  lockerTestPhotos6: z.array(z.string()).optional(),
  lockerTestPhotos7: z.array(z.string()).optional(),

  // Ground & Plexo Test
  groundingTest: z.enum(['passed', 'failed'], 'Required'),
  groundingTestPhotos: z.array(z.string()).optional(),
  groundingTestPhotos2: z.array(z.string()).optional(),
  plexoCondition: z.enum(['good', 'fair', 'poor'], 'Required'),

  // Completion
  completionNotes: z.string().optional(),
  completionPhotos: z.array(z.string()).optional(),
});

type WindAuditFormData = z.infer<typeof windAuditSchema>;

interface WindAuditFormProps {
  workOrderId: string;
  onSubmit: (data: WindAuditFormData) => Promise<void>;
  onCancel?: () => void;
}

export function WindAuditForm({
  workOrderId,
  onSubmit,
  onCancel,
}: WindAuditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [siteCheckExpanded, setSiteCheckExpanded] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WindAuditFormData>({
    resolver: zodResolver(windAuditSchema),
  });

  const environmentalIssues = watch('environmentalIssues');
  const screenWorking = watch('screenWorking');
  const compartmentsWorking = watch('compartmentsWorking');

  const handleFormSubmit = async (data: WindAuditFormData) => {
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* SECTION 1: Site Check (Collapsible) */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setSiteCheckExpanded(!siteCheckExpanded)}
          className="w-full bg-gray-50 px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">1. Site Check</h3>
          <svg
            className={`w-5 h-5 transform transition-transform ${
              siteCheckExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {siteCheckExpanded && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Accessible? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="yes"
                    {...register('siteAccessible')}
                    className="mr-2"
                  />
                  <span className="text-sm">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="no"
                    {...register('siteAccessible')}
                    className="mr-2"
                  />
                  <span className="text-sm">No</span>
                </label>
              </div>
              {errors.siteAccessible && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.siteAccessible.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="siteCondition"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Site Condition <span className="text-red-500">*</span>
              </label>
              <select
                id="siteCondition"
                {...register('siteCondition')}
                className={`w-full px-4 py-3 border rounded-lg ${
                  errors.siteCondition ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select condition</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
              {errors.siteCondition && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.siteCondition.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="siteIssues"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Site Issues (if any)
              </label>
              <textarea
                id="siteIssues"
                {...register('siteIssues')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Photos
              </label>
              <FileUpload
                workOrderId={workOrderId}
                maxFiles={10}
                onUploadComplete={(urls) => setValue('sitePhotos', urls)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Wind Audit */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">2. Wind Audit</h3>

        <div>
          <label
            htmlFor="windConditions"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Wind Conditions <span className="text-red-500">*</span>
          </label>
          <select
            id="windConditions"
            {...register('windConditions')}
            className={`w-full px-4 py-3 border rounded-lg ${
              errors.windConditions ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select conditions</option>
            <option value="calm">Calm</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="strong">Strong</option>
          </select>
          {errors.windConditions && (
            <p className="mt-1 text-sm text-red-600">
              {errors.windConditions.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="windNotes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Wind Audit Notes
          </label>
          <textarea
            id="windNotes"
            {...register('windNotes')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environmental Issues? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="yes"
                {...register('environmentalIssues')}
                className="mr-2"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="no"
                {...register('environmentalIssues')}
                className="mr-2"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {errors.environmentalIssues && (
            <p className="mt-1 text-sm text-red-600">
              {errors.environmentalIssues.message}
            </p>
          )}
        </div>

        {environmentalIssues === 'yes' && (
          <div>
            <label
              htmlFor="environmentalIssuesDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Describe Environmental Issues
            </label>
            <textarea
              id="environmentalIssuesDescription"
              {...register('environmentalIssuesDescription')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wind Audit Photos <span className="text-red-500">*</span>
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('windAuditPhotos', urls, { shouldValidate: true })}
            disabled={isSubmitting}
          />
          {errors.windAuditPhotos && (
            <p className="mt-1 text-sm text-red-600">
              {errors.windAuditPhotos.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Photos (Set 2)
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('windAuditPhotos2', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Photos (Set 3)
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('windAuditPhotos3', urls)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* SECTION 3: Locker Before */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">3. Locker Before</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Locker Before Photos <span className="text-red-500">*</span>
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerBeforePhotos', urls, { shouldValidate: true })}
            disabled={isSubmitting}
          />
          {errors.lockerBeforePhotos && (
            <p className="mt-1 text-sm text-red-600">
              {errors.lockerBeforePhotos.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="batteryVoltage"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Battery Voltage
            </label>
            <input
              id="batteryVoltage"
              type="text"
              {...register('batteryVoltage')}
              placeholder="e.g. 12.5V"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="batteryPercentage"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Battery %
            </label>
            <input
              id="batteryPercentage"
              type="text"
              {...register('batteryPercentage')}
              placeholder="e.g. 85%"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Battery Photos
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerBeforePhotos2', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Screen Working? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="yes"
                {...register('screenWorking')}
                className="mr-2"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="no"
                {...register('screenWorking')}
                className="mr-2"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {errors.screenWorking && (
            <p className="mt-1 text-sm text-red-600">
              {errors.screenWorking.message}
            </p>
          )}
        </div>

        {screenWorking === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Screen Photos
            </label>
            <FileUpload
              workOrderId={workOrderId}
              maxFiles={10}
              onUploadComplete={(urls) => setValue('lockerBeforePhotos3', urls)}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      {/* SECTION 4: Locker Test */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">4. Locker Test</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Photos <span className="text-red-500">*</span>
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerTestPhotos', urls, { shouldValidate: true })}
            disabled={isSubmitting}
          />
          {errors.lockerTestPhotos && (
            <p className="mt-1 text-sm text-red-600">
              {errors.lockerTestPhotos.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="compartmentsWorking"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Compartments Working? <span className="text-red-500">*</span>
          </label>
          <select
            id="compartmentsWorking"
            {...register('compartmentsWorking')}
            className={`w-full px-4 py-3 border rounded-lg ${
              errors.compartmentsWorking ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select</option>
            <option value="all">All Working</option>
            <option value="some">Some Working</option>
            <option value="none">None Working</option>
          </select>
          {errors.compartmentsWorking && (
            <p className="mt-1 text-sm text-red-600">
              {errors.compartmentsWorking.message}
            </p>
          )}
        </div>

        {(compartmentsWorking === 'some' || compartmentsWorking === 'none') && (
          <div>
            <label
              htmlFor="compartmentIssues"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Describe Compartment Issues
            </label>
            <textarea
              id="compartmentIssues"
              {...register('compartmentIssues')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compartment Photos
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerTestPhotos2', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Printer Working? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="yes"
                {...register('printerWorking')}
                className="mr-2"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="no"
                {...register('printerWorking')}
                className="mr-2"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {errors.printerWorking && (
            <p className="mt-1 text-sm text-red-600">
              {errors.printerWorking.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Test Photos
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerTestPhotos3', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            More Test Photos (Set 4)
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerTestPhotos4', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            More Test Photos (Set 5)
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerTestPhotos5', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            More Test Photos (Set 6)
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerTestPhotos6', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            More Test Photos (Set 7)
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('lockerTestPhotos7', urls)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* SECTION 5: Ground & Plexo Test */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          5. Ground & Plexo Test
        </h3>

        <div>
          <label
            htmlFor="groundingTest"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Grounding Test <span className="text-red-500">*</span>
          </label>
          <select
            id="groundingTest"
            {...register('groundingTest')}
            className={`w-full px-4 py-3 border rounded-lg ${
              errors.groundingTest ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select result</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
          {errors.groundingTest && (
            <p className="mt-1 text-sm text-red-600">
              {errors.groundingTest.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grounding Test Photos
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('groundingTestPhotos', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            More Grounding Photos
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('groundingTestPhotos2', urls)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="plexoCondition"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Plexo Condition <span className="text-red-500">*</span>
          </label>
          <select
            id="plexoCondition"
            {...register('plexoCondition')}
            className={`w-full px-4 py-3 border rounded-lg ${
              errors.plexoCondition ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select condition</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
          {errors.plexoCondition && (
            <p className="mt-1 text-sm text-red-600">
              {errors.plexoCondition.message}
            </p>
          )}
        </div>
      </div>

      {/* SECTION 6: Completion */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">6. Completion</h3>

        <div>
          <label
            htmlFor="completionNotes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Completion Notes
          </label>
          <textarea
            id="completionNotes"
            {...register('completionNotes')}
            rows={4}
            placeholder="Add any final notes or observations..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Final Photos
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('completionPhotos', urls)}
            disabled={isSubmitting}
          />
        </div>
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
            'Submit Wind Audit'
          )}
        </button>
      </div>
    </form>
  );
}
