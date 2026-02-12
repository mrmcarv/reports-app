/**
 * Form Configuration System
 *
 * Central configuration for all form types in the application.
 * This configuration drives form behavior, validation, and UI flow.
 *
 * To add a new form type:
 * 1. Add entry to FORM_CONFIG below
 * 2. Create the form component (e.g., components/forms/NewFormType.tsx)
 * 3. That's it! The flow logic auto-adjusts based on config.
 *
 * To change form rules:
 * 1. Update the config properties (e.g., set requiresPartsTracking: true)
 * 2. Behavior updates automatically throughout the app
 */

/**
 * Reporting categories for maintenance forms
 * Each category represents a specific type of maintenance issue
 */
export const MAINTENANCE_CATEGORIES = [
  {
    value: 'compartment_does_not_open',
    label: 'Compartment Does Not Open',
  },
  {
    value: 'screen_is_black',
    label: 'Screen Is Black',
  },
  {
    value: 'printer_does_not_work',
    label: 'Printer Does Not Work',
  },
  {
    value: 'battery_under_voltage',
    label: 'Battery Under Voltage',
  },
  {
    value: 'scanner_does_not_work',
    label: 'Scanner Does Not Work',
  },
  {
    value: 'screen_not_responsive',
    label: 'Screen Not Responsive',
  },
  {
    value: 'hypercare',
    label: 'Hypercare',
  },
  {
    value: 'all_retrofit',
    label: 'All Retrofit',
  },
  {
    value: 'other',
    label: 'Other',
  },
] as const;

/**
 * Form configuration interface
 */
export interface FormConfig {
  /** Display name for the form type */
  name: string;

  /** Component name to render (e.g., "BatterySwapForm") */
  component: string;

  /** Can this form be added multiple times to the same work order? */
  repeatable: boolean;

  /** Does this form require parts tracking at the end? */
  requiresPartsTracking: boolean;

  /** Can this form be combined with other form types in the same work order? */
  canCombineWithOthers: boolean;

  /** Does this form require selecting a category? (e.g., maintenance) */
  requiresCategory: boolean;

  /** List of categories if requiresCategory is true */
  categories?: readonly { value: string; label: string }[];
}

/**
 * Central form configuration
 *
 * This object defines all form types and their behavior.
 * The application uses this config to determine:
 * - Which forms can be added
 * - Whether forms can be repeated
 * - Whether parts tracking is needed
 * - Whether forms can be combined
 */
export const FORM_CONFIG = {
  battery_swap: {
    name: 'Battery Swap',
    component: 'BatterySwapForm',
    repeatable: false, // Can only add once per WO
    requiresPartsTracking: false, // No parts tracking for MVP (may add later)
    canCombineWithOthers: false, // Standalone only for MVP (may change in v2)
    requiresCategory: false,
  },

  maintenance: {
    name: 'Maintenance',
    component: 'MaintenanceForm', // ONE reusable component for ALL categories
    repeatable: true, // Can add multiple (one per category/issue)
    requiresPartsTracking: true, // Maintenance can use parts
    canCombineWithOthers: true, // Can mix with wind audit
    requiresCategory: true, // Must select reporting category
    categories: MAINTENANCE_CATEGORIES,
  },

  wind_audit: {
    name: 'Wind Audit',
    component: 'WindAuditForm',
    repeatable: false, // One per WO
    requiresPartsTracking: true, // Wind audits can use parts
    canCombineWithOthers: true, // Can mix with maintenance
    requiresCategory: false,
  },

  survey: {
    name: 'Survey',
    component: 'SurveyForm',
    repeatable: false, // One per WO
    requiresPartsTracking: false, // Surveys don't need parts
    canCombineWithOthers: true, // Can mix with other forms
    requiresCategory: false,
    // MVP: Placeholder only, minimal implementation
  },
} as const satisfies Record<string, FormConfig>;

/**
 * Type for form type keys
 */
export type FormType = keyof typeof FORM_CONFIG;

/**
 * Type for maintenance category values
 */
export type MaintenanceCategory =
  (typeof MAINTENANCE_CATEGORIES)[number]['value'];

/**
 * Helper function to get available form types for a work order
 *
 * @param currentForms - Array of form types already added to the work order
 * @returns Array of form types that can still be added
 */
export function getAvailableFormTypes(
  currentForms: { formType: FormType; category?: string }[]
): { type: FormType; label: string; requiresCategory: boolean }[] {
  return Object.entries(FORM_CONFIG)
    .filter(([type, config]) => {
      const formType = type as FormType;
      const existingForms = currentForms.filter((f) => f.formType === formType);

      // If not repeatable and already added, can't add again
      if (!config.repeatable && existingForms.length > 0) {
        return false;
      }

      // If form can't combine with others and we have other types, can't add
      if (!config.canCombineWithOthers && currentForms.length > 0) {
        return false;
      }

      // If we have a non-combinable form already, can't add anything else
      const hasNonCombinableForm = currentForms.some(
        (f) => !FORM_CONFIG[f.formType].canCombineWithOthers
      );
      if (hasNonCombinableForm && currentForms.length > 0) {
        return false;
      }

      return true;
    })
    .map(([type, config]) => ({
      type: type as FormType,
      label: config.name,
      requiresCategory: config.requiresCategory,
    }));
}

/**
 * Helper function to check if a form type requires parts tracking
 *
 * @param formType - The form type to check
 * @returns Whether the form type requires parts tracking
 */
export function requiresPartsTracking(formType: FormType): boolean {
  return FORM_CONFIG[formType].requiresPartsTracking;
}

/**
 * Helper function to get forms that need parts tracking from a list
 *
 * @param forms - Array of completed forms
 * @returns Array of forms that require parts tracking
 */
export function getFormsNeedingParts<T extends { formType: FormType }>(
  forms: T[]
): T[] {
  return forms.filter((form) => requiresPartsTracking(form.formType));
}
