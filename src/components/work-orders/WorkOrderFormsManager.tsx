/**
 * Work Order Forms Manager
 *
 * Manages multiple form submissions for a single work order
 * Shows completed forms and allows adding more interventions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MaintenanceFormWrapper } from './MaintenanceFormWrapper';
import { WindAuditFormWrapper } from './WindAuditFormWrapper';

interface CompletedForm {
  id: number;
  type: 'maintenance' | 'wind_audit' | 'survey';
  submittedAt: Date;
  data?: any;
}

interface WorkOrderFormsManagerProps {
  workOrderId: string; // Airtable WO ID
  supabaseWorkOrderId: number; // Supabase work_orders.id
  completedForms: CompletedForm[];
  availableFormTypes: Array<'maintenance' | 'wind_audit' | 'survey'>;
}

type FormType = 'maintenance' | 'wind_audit' | 'survey' | null;

export function WorkOrderFormsManager({
  workOrderId,
  supabaseWorkOrderId,
  completedForms,
  availableFormTypes,
}: WorkOrderFormsManagerProps) {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<FormType>(null);

  // If no forms completed yet, show first available form
  const showInitialForm = completedForms.length === 0 && !activeForm;

  const handleFormComplete = () => {
    // After form submission, refresh the page to update completed forms list
    window.location.reload();
  };

  const getFormIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'wind_audit':
        return '🌬️';
      case 'survey':
        return '📋';
      default:
        return '📄';
    }
  };

  const getFormLabel = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'Maintenance';
      case 'wind_audit':
        return 'Wind Audit';
      case 'survey':
        return 'Survey';
      default:
        return type;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Completed Forms List */}
      {completedForms.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completed Interventions ({completedForms.length})
          </h3>
          <div className="space-y-3">
            {completedForms.map((form) => (
              <div
                key={`${form.type}-${form.id}`}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFormIcon(form.type)}</span>
                  <div>
                    <p className="font-medium text-green-900">
                      {getFormLabel(form.type)}
                    </p>
                    {form.data?.reportingCategory && (
                      <p className="text-sm text-green-700">
                        {form.data.reportingCategory}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-green-600">
                  {formatDate(form.submittedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Form (if user clicked "Add Another") */}
      {activeForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {getFormIcon(activeForm)} {getFormLabel(activeForm)}
            </h3>
            <button
              onClick={() => setActiveForm(null)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>

          {activeForm === 'maintenance' && (
            <MaintenanceFormWrapper
              workOrderId={workOrderId}
              supabaseWorkOrderId={supabaseWorkOrderId}
              onSuccess={handleFormComplete}
            />
          )}

          {activeForm === 'wind_audit' && (
            <WindAuditFormWrapper
              workOrderId={workOrderId}
              supabaseWorkOrderId={supabaseWorkOrderId}
              onSuccess={handleFormComplete}
            />
          )}

          {activeForm === 'survey' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Survey form coming soon...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Another Intervention (if no active form) */}
      {!activeForm && availableFormTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {completedForms.length === 0
              ? 'Start Intervention'
              : 'Add Another Intervention'}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {availableFormTypes.map((formType) => (
              <button
                key={formType}
                onClick={() => setActiveForm(formType)}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <span className="text-2xl">{getFormIcon(formType)}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {getFormLabel(formType)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formType === 'maintenance' &&
                      'Complete maintenance tasks and repairs'}
                    {formType === 'wind_audit' && 'Perform wind audit inspection'}
                    {formType === 'survey' && 'Complete survey questionnaire'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Complete Work Order Button */}
      {completedForms.length > 0 && !activeForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Finish Work Order
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            All interventions completed? Click below to finalize and sync to
            Airtable.
          </p>
          <button
            onClick={() => {
              // Navigate to parts tracking page
              router.push(`/work-order/${workOrderId}/parts`);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition"
          >
            Complete Work Order
          </button>
        </div>
      )}

      {/* Show initial form if no forms completed yet */}
      {showInitialForm && availableFormTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {getFormIcon(availableFormTypes[0])}{' '}
            {getFormLabel(availableFormTypes[0])}
          </h3>

          {availableFormTypes[0] === 'maintenance' && (
            <MaintenanceFormWrapper
              workOrderId={workOrderId}
              supabaseWorkOrderId={supabaseWorkOrderId}
              onSuccess={handleFormComplete}
            />
          )}

          {availableFormTypes[0] === 'wind_audit' && (
            <WindAuditFormWrapper
              workOrderId={workOrderId}
              supabaseWorkOrderId={supabaseWorkOrderId}
              onSuccess={handleFormComplete}
            />
          )}
        </div>
      )}
    </div>
  );
}
