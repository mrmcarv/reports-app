/**
 * Airtable API Client (Read-Only)
 *
 * This client reads work orders from the DeBloq Airtable base.
 * Used for:
 * - Dashboard to display assigned work orders
 * - Fetching work order details
 *
 * IMPORTANT: This is READ-ONLY. We never write to DeBloq base directly.
 * Writes go through n8n webhook to the Reports base.
 */

import Airtable from 'airtable';

// Initialize Airtable
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const debloqBase = airtable.base(process.env.AIRTABLE_BASE_ID_DEBLOQ!);

/**
 * Work Order from Airtable (DeBloq base)
 */
export interface AirtableWorkOrder {
  id: string; // Airtable record ID
  workOrderId: string;
  workType: 'battery_swap' | 'maintenance' | 'wind_audit' | 'survey';
  client?: string;
  pointCode?: string;
  fullAddress?: string;
  lockerVersion?: string;
  initialIssue?: string;
  plannedDate?: string;
  step?: string;
  status?: string;
  technicianEmail?: string;
}

/**
 * Fetch work orders for a specific technician
 *
 * Filters:
 * - step = "SCHEDULED"
 * - status = "ON_TRACK"
 * - Assigned to the specified technician
 *
 * Sorted by PLANNED_DATE ascending
 *
 * @param technicianEmail - Email of the technician
 * @returns Array of work orders
 */
export async function fetchWorkOrdersForTechnician(
  technicianEmail: string
): Promise<AirtableWorkOrder[]> {
  try {
    const records = await debloqBase('tblRJg3g7olM5agaY')
      .select({
        view: 'Grid view',
        filterByFormula: `AND(
          OR(
            {Step} = "3-Scheduled ",
            {Step} = "4-In Progress",
            {Step} = "5-Awaiting Validation",
            {Step} = "6-Done"
          ),
          {Status} = "On Track",
          {Technician_drona} = "${technicianEmail}"
        )`,
        sort: [{ field: 'Planned Date', direction: 'asc' }],
      })
      .all();

    return records.map((record) => {
      // Stage Type returns an array, get first element
      const stageTypeRaw = record.get('Stage Type');
      const stageType = Array.isArray(stageTypeRaw)
        ? stageTypeRaw[0]
        : stageTypeRaw;

      // Map Airtable stage type to our work type
      let workType: AirtableWorkOrder['workType'];
      if (stageType === 'Battery Swap') {
        workType = 'battery_swap';
      } else if (stageType === 'Work Order') {
        workType = 'maintenance';
      } else if (stageType === 'Wind Audit') {
        workType = 'wind_audit';
      } else if (stageType === 'Survey') {
        workType = 'survey';
      } else {
        workType = 'maintenance'; // Default to maintenance
      }

      return {
        id: record.id,
        workOrderId: record.get('WO_ID') as string,
        workType,
        client: record.get('Client') as string | undefined,
        pointCode: record.get('Bloqit ID') as string | undefined,
        fullAddress: record.get('Full Address') as string | undefined,
        lockerVersion: record.get('Locker') as string | undefined,
        initialIssue: record.get('Description Complete') as string | undefined,
        plannedDate: record.get('Planned Date') as string | undefined,
        step: record.get('Step') as string | undefined,
        status: record.get('Status') as string | undefined,
        technicianEmail: record.get('Technician_drona') as string | undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching work orders from Airtable:', error);
    throw new Error('Failed to fetch work orders from Airtable');
  }
}

/**
 * Fetch a single work order by ID
 *
 * @param workOrderId - The work order ID
 * @returns Work order or null if not found
 */
export async function fetchWorkOrderById(
  workOrderId: string
): Promise<AirtableWorkOrder | null> {
  try {
    const records = await debloqBase('tblRJg3g7olM5agaY')
      .select({
        view: 'Grid view',
        filterByFormula: `{WO_ID} = "${workOrderId}"`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];

    // Stage Type returns an array, get first element
    const stageTypeRaw = record.get('Stage Type');
    const stageType = Array.isArray(stageTypeRaw)
      ? stageTypeRaw[0]
      : stageTypeRaw;

    // Map Airtable stage type to our work type
    let workType: AirtableWorkOrder['workType'];
    if (stageType === 'Battery Swap') {
      workType = 'battery_swap';
    } else if (stageType === 'Work Order') {
      workType = 'maintenance';
    } else if (stageType === 'Wind Audit') {
      workType = 'wind_audit';
    } else if (stageType === 'Survey') {
      workType = 'survey';
    } else {
      workType = 'maintenance'; // Default to maintenance
    }

    return {
      id: record.id,
      workOrderId: record.get('WO_ID') as string,
      workType,
      client: record.get('Client') as string | undefined,
      pointCode: record.get('Bloqit ID') as string | undefined,
      fullAddress: record.get('Full Address') as string | undefined,
      lockerVersion: record.get('Locker') as string | undefined,
      initialIssue: record.get('Description Complete') as string | undefined,
      plannedDate: record.get('Planned Date') as string | undefined,
      step: record.get('Step') as string | undefined,
      status: record.get('Status') as string | undefined,
      technicianEmail: record.get('Technician_drona') as string | undefined,
    };
  } catch (error) {
    console.error('Error fetching work order from Airtable:', error);
    throw new Error('Failed to fetch work order from Airtable');
  }
}

/**
 * Group work orders by date category
 *
 * @param workOrders - Array of work orders
 * @returns Grouped work orders (Today, Upcoming, Overdue)
 */
export function groupWorkOrdersByDate(workOrders: AirtableWorkOrder[]): {
  today: AirtableWorkOrder[];
  upcoming: AirtableWorkOrder[];
  overdue: AirtableWorkOrder[];
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const grouped = {
    today: [] as AirtableWorkOrder[],
    upcoming: [] as AirtableWorkOrder[],
    overdue: [] as AirtableWorkOrder[],
  };

  workOrders.forEach((wo) => {
    if (!wo.plannedDate) {
      grouped.upcoming.push(wo);
      return;
    }

    const plannedDate = new Date(wo.plannedDate);

    if (plannedDate < today) {
      grouped.overdue.push(wo);
    } else if (plannedDate >= today && plannedDate < tomorrow) {
      grouped.today.push(wo);
    } else {
      grouped.upcoming.push(wo);
    }
  });

  return grouped;
}
