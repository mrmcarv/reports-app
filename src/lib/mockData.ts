/**
 * Mock Work Orders Data
 *
 * For development and testing without Airtable dependency.
 * Toggle between mock and real data using NEXT_PUBLIC_USE_MOCK_DATA env variable.
 */

import { AirtableWorkOrder } from './airtable';

/**
 * Check if we should use mock data
 */
export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

/**
 * Mock work orders for testing different scenarios
 */
export const MOCK_WORK_ORDERS: AirtableWorkOrder[] = [
  // Overdue work order
  {
    id: 'rec1',
    workOrderId: '88123',
    workType: 'battery_swap',
    client: 'Inpost',
    pointCode: 'BCN-001',
    lockerVersion: 'Inpost14163',
    initialIssue: 'Battery Alert - Bat1: 84.2%/13.1V | Bat2: 94.4%/12V',
    plannedDate: '2026-02-10T09:00:00.000Z', // 2 days ago
    step: '3-Scheduled',
    status: 'On Track',
    technicianEmail: 'cfigueredo@dicharger.es',
  },

  // Today - Battery Swap
  {
    id: 'rec2',
    workOrderId: '88460',
    workType: 'battery_swap',
    client: 'Inpost',
    pointCode: '68d695fc844b468155d17f1d',
    lockerVersion: 'Inpost14163',
    initialIssue: 'Battery under voltage - needs replacement',
    plannedDate: new Date().toISOString(), // Today
    step: '3-Scheduled',
    status: 'On Track',
    technicianEmail: 'cfigueredo@dicharger.es',
  },

  // Today - Maintenance
  {
    id: 'rec3',
    workOrderId: '88235',
    workType: 'maintenance',
    client: 'VintedGo',
    pointCode: 'MAD-015',
    lockerVersion: 'V3',
    initialIssue: 'Screen is black - not responding to touch',
    plannedDate: new Date().toISOString(), // Today
    step: '3-Scheduled',
    status: 'On Track',
    technicianEmail: 'cfigueredo@dicharger.es',
  },

  // Tomorrow - Wind Audit
  {
    id: 'rec4',
    workOrderId: '88567',
    workType: 'wind_audit',
    client: 'GLS',
    pointCode: 'GLS06075',
    lockerVersion: 'V2',
    initialIssue: 'Quarterly wind audit inspection',
    plannedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    step: '3-Scheduled',
    status: 'On Track',
    technicianEmail: 'cfigueredo@dicharger.es',
  },

  // Next week - Survey
  {
    id: 'rec5',
    workOrderId: '85588',
    workType: 'survey',
    client: 'VintedGo',
    pointCode: 'Carrefour Express - Leefdaal',
    plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    step: '3-Scheduled',
    status: 'On Track',
    technicianEmail: 'cfigueredo@dicharger.es',
  },

  // Next week - Maintenance
  {
    id: 'rec6',
    workOrderId: '88789',
    workType: 'maintenance',
    client: 'Inpost',
    pointCode: 'BCN-023',
    lockerVersion: 'Inpost14200',
    initialIssue: 'Compartment does not open - mechanical issue',
    plannedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    step: '3-Scheduled',
    status: 'On Track',
    technicianEmail: 'cfigueredo@dicharger.es',
  },
];

/**
 * Get mock work orders (simulates API delay)
 */
export async function getMockWorkOrders(): Promise<AirtableWorkOrder[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_WORK_ORDERS;
}
