/**
 * Maintenance Form Component
 *
 * Reusable template for all maintenance interventions.
 * Features:
 * - Reporting category dropdown (9 categories)
 * - 4 sections: Issue ID, Initial Assessment, Work Performed, Completion
 * - Multiple photo upload sections (before, during, after)
 * - Form validation
 * - Saves as JSONB with embedded photo URLs
 *
 * Used for: compartment issues, screen problems, printer, battery, scanner, etc.
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUpload } from '@/components/FileUpload';

// Reporting categories from formConfig
const MAINTENANCE_CATEGORIES = [
  { value: 'compartment_does_not_open', label: 'Compartment Does Not Open' },
  { value: 'screen_is_black', label: 'Screen Is Black' },
  { value: 'printer_does_not_work', label: 'Printer Does Not Work' },
  { value: 'battery_under_voltage', label: 'Battery Under Voltage' },
  { value: 'scanner_does_not_work', label: 'Scanner Does Not Work' },
  { value: 'screen_not_responsive', label: 'Screen Not Responsive' },
  { value: 'hypercare', label: 'Hypercare' },
  { value: 'all_retrofit', label: 'All Retrofit' },
  { value: 'other', label: 'Other' },
] as const;

const ISSUE_TYPES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

const RESOLUTION_STATUS = [
  { value: 'yes', label: 'Yes - Fully Resolved' },
  { value: 'partially', label: 'Partially Resolved' },
  { value: 'no', label: 'No - Not Resolved' },
] as const;

// Validation schema
const maintenanceSchema = z.object({
  // Issue Identification
  reportingCategory: z.string().min(1, 'Reporting category is required'),
  issueDescription: z.string().min(10, 'Issue description must be at least 10 characters'),
  issueType: z.string().min(1, 'Issue type is required'),

  // Initial Assessment
  beforePhotos: z.array(z.string()).min(1, 'At least one before photo is required'),
  issueConfirmed: z.enum(['yes', 'no'], 'Please confirm the issue'),
  actualIssue: z.string().optional(),
  rootCause: z.string().min(10, 'Root cause must be at least 10 characters'),

  // Work Performed
  maintenanceActions: z.array(z.string()).min(1, 'At least one action is required'),
  workDescription: z.string().min(20, 'Work description must be at least 20 characters'),
  workPhotos: z.array(z.string()).optional(),

  // Completion
  afterPhotos: z.array(z.string()).min(1, 'At least one after photo is required'),
  issueResolved: z.enum(['yes', 'partially', 'no'], 'Please indicate resolution status'),
  testingPerformed: z.string().min(10, 'Testing description must be at least 10 characters'),
  additionalIssuesFound: z.enum(['yes', 'no'], 'Please indicate if additional issues were found'),
  additionalIssuesDescription: z.string().optional(),
  completionNotes: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceFormProps {
  workOrderId: string;
  onSubmit: (data: MaintenanceFormData) => Promise<void>;
  onCancel?: () => void;
}

const MAINTENANCE_ACTIONS = [
  'Cleaned components',
  'Replaced parts',
  'Adjusted settings',
  'Performed tests',
  'Updated software',
  'Calibrated system',
  'Inspected connections',
  'Other',
];

export function MaintenanceForm({
  workOrderId,
  onSubmit,
  onCancel,
}: MaintenanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenanceActions: [],
      beforePhotos: [],
      workPhotos: [],
      afterPhotos: [],
    },
  });

  const issueConfirmed = watch('issueConfirmed');
  const additionalIssuesFound = watch('additionalIssuesFound');

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data: MaintenanceFormData) => {
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
      {/* SECTION 1: Issue Identification */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          1. Issue Identification
        </h3>

        {/* Reporting Category */}
        <div>
          <label
            htmlFor="reportingCategory"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Reporting Category <span className="text-red-500">*</span>
          </label>
          <select
            id="reportingCategory"
            {...register('reportingCategory')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.reportingCategory ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select category</option>
            {MAINTENANCE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.reportingCategory && (
            <p className="mt-1 text-sm text-red-600">
              {errors.reportingCategory.message}
            </p>
          )}
        </div>

        {/* Issue Description */}
        <div>
          <label
            htmlFor="issueDescription"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Issue Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="issueDescription"
            {...register('issueDescription')}
            rows={3}
            placeholder="Describe the issue in detail..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.issueDescription ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.issueDescription && (
            <p className="mt-1 text-sm text-red-600">
              {errors.issueDescription.message}
            </p>
          )}
        </div>

        {/* Issue Type */}
        <div>
          <label
            htmlFor="issueType"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Issue Type/Severity <span className="text-red-500">*</span>
          </label>
          <select
            id="issueType"
            {...register('issueType')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.issueType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select severity</option>
            {ISSUE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.issueType && (
            <p className="mt-1 text-sm text-red-600">{errors.issueType.message}</p>
          )}
        </div>
      </div>

      {/* SECTION 2: Initial Assessment */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          2. Initial Assessment
        </h3>

        {/* Before Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Site Photos - Before <span className="text-red-500">*</span>
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('beforePhotos', urls, { shouldValidate: true })}
            onError={(error) => console.error('Upload error:', error)}
            disabled={isSubmitting}
          />
          {errors.beforePhotos && (
            <p className="mt-1 text-sm text-red-600">{errors.beforePhotos.message}</p>
          )}
        </div>

        {/* Issue Confirmed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Confirmed? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="yes"
                {...register('issueConfirmed')}
                className="mr-2"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="no"
                {...register('issueConfirmed')}
                className="mr-2"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {errors.issueConfirmed && (
            <p className="mt-1 text-sm text-red-600">{errors.issueConfirmed.message}</p>
          )}
        </div>

        {/* Actual Issue (if different) */}
        {issueConfirmed === 'no' && (
          <div>
            <label
              htmlFor="actualIssue"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Actual Issue (if different)
            </label>
            <textarea
              id="actualIssue"
              {...register('actualIssue')}
              rows={2}
              placeholder="Describe the actual issue found..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Root Cause */}
        <div>
          <label
            htmlFor="rootCause"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Root Cause <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rootCause"
            {...register('rootCause')}
            rows={3}
            placeholder="Explain the root cause of the issue..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.rootCause ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.rootCause && (
            <p className="mt-1 text-sm text-red-600">{errors.rootCause.message}</p>
          )}
        </div>
      </div>

      {/* SECTION 3: Work Performed */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">3. Work Performed</h3>

        {/* Maintenance Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maintenance Actions Taken <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {MAINTENANCE_ACTIONS.map((action) => (
              <label key={action} className="flex items-center">
                <input
                  type="checkbox"
                  value={action}
                  {...register('maintenanceActions')}
                  className="mr-2"
                />
                <span className="text-sm">{action}</span>
              </label>
            ))}
          </div>
          {errors.maintenanceActions && (
            <p className="mt-1 text-sm text-red-600">
              {errors.maintenanceActions.message}
            </p>
          )}
        </div>

        {/* Work Description */}
        <div>
          <label
            htmlFor="workDescription"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Work Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="workDescription"
            {...register('workDescription')}
            rows={4}
            placeholder="Provide a detailed description of the work performed..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.workDescription ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.workDescription && (
            <p className="mt-1 text-sm text-red-600">
              {errors.workDescription.message}
            </p>
          )}
        </div>

        {/* Work Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Work-in-Progress Photos (Optional)
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('workPhotos', urls)}
            onError={(error) => console.error('Upload error:', error)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* SECTION 4: Completion */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">4. Completion</h3>

        {/* After Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            After Photos <span className="text-red-500">*</span>
          </label>
          <FileUpload
            workOrderId={workOrderId}
            maxFiles={10}
            onUploadComplete={(urls) => setValue('afterPhotos', urls, { shouldValidate: true })}
            onError={(error) => console.error('Upload error:', error)}
            disabled={isSubmitting}
          />
          {errors.afterPhotos && (
            <p className="mt-1 text-sm text-red-600">{errors.afterPhotos.message}</p>
          )}
        </div>

        {/* Issue Resolved */}
        <div>
          <label
            htmlFor="issueResolved"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Issue Resolved? <span className="text-red-500">*</span>
          </label>
          <select
            id="issueResolved"
            {...register('issueResolved')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.issueResolved ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select resolution status</option>
            {RESOLUTION_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          {errors.issueResolved && (
            <p className="mt-1 text-sm text-red-600">{errors.issueResolved.message}</p>
          )}
        </div>

        {/* Testing Performed */}
        <div>
          <label
            htmlFor="testingPerformed"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Testing Performed <span className="text-red-500">*</span>
          </label>
          <textarea
            id="testingPerformed"
            {...register('testingPerformed')}
            rows={3}
            placeholder="Describe tests performed to verify the fix..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.testingPerformed ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.testingPerformed && (
            <p className="mt-1 text-sm text-red-600">
              {errors.testingPerformed.message}
            </p>
          )}
        </div>

        {/* Additional Issues Found */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Issues Found? <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="yes"
                {...register('additionalIssuesFound')}
                className="mr-2"
              />
              <span className="text-sm">Yes</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="no"
                {...register('additionalIssuesFound')}
                className="mr-2"
              />
              <span className="text-sm">No</span>
            </label>
          </div>
          {errors.additionalIssuesFound && (
            <p className="mt-1 text-sm text-red-600">
              {errors.additionalIssuesFound.message}
            </p>
          )}
        </div>

        {/* Additional Issues Description */}
        {additionalIssuesFound === 'yes' && (
          <div>
            <label
              htmlFor="additionalIssuesDescription"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Describe Additional Issues
            </label>
            <textarea
              id="additionalIssuesDescription"
              {...register('additionalIssuesDescription')}
              rows={3}
              placeholder="Describe the additional issues found..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Completion Notes */}
        <div>
          <label
            htmlFor="completionNotes"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Completion Notes (Optional)
          </label>
          <textarea
            id="completionNotes"
            {...register('completionNotes')}
            rows={3}
            placeholder="Any additional notes..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            'Submit Maintenance Form'
          )}
        </button>
      </div>
    </form>
  );
}
