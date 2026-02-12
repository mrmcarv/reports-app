# Airtable Integration Testing Guide

## Prerequisites

Before testing, make sure you have:
1. ✅ `AIRTABLE_API_KEY` set in `.env.local`
2. ✅ `AIRTABLE_BASE_ID_DEBLOQ` set in `.env.local`
3. ✅ Work orders in your Airtable DeBloq base
4. ✅ At least one technician with assigned work orders

## Field Names in Airtable

The integration expects these field names in your "Work Orders" table:

### Required Fields:
- `work_order_id` - Unique work order identifier
- `WO_TYPE` - Work order type (battery_swap, maintenance, wind_audit, survey)
- `step` - Current step (should be "SCHEDULED" for active work)
- `status` - Status (should be "ON_TRACK" for active work)
- `technician_email` - Email of assigned technician

### Optional Fields:
- `CLIENT` - Client name
- `POINT_CODE` - Location/point code
- `LOCKER_VERSION` - Locker version
- `INITIAL_ISSUE` - Description of the issue
- `PLANNED_DATE` - When the work is scheduled

**Note:** Field names are case-sensitive!

## Running the Test

### Step 1: Find a Technician Email

Look in your Airtable "Work Orders" table and find a technician email that has work orders assigned.

### Step 2: Run the Test

```bash
npm run test:airtable -- technician@example.com
```

Replace `technician@example.com` with an actual email from your Airtable.

## What the Test Does

1. ✅ Checks environment variables are set
2. ✅ Fetches work orders for the technician
3. ✅ Displays all found work orders
4. ✅ Groups them by date (Today/Upcoming/Overdue)
5. ✅ Tests fetching a single work order by ID

## Expected Output

### Success:
```
🔍 Testing Airtable integration...

✓ Checking environment variables...
  ✅ Environment variables set

🔍 Fetching work orders for: tech@example.com

✓ Test 1: Fetching work orders...
  ✅ Fetched 3 work orders

📋 Work Orders Found:
────────────────────────────────────────────────────────────

1. WO-12345
   Type: battery_swap
   Client: Client Name
   Point Code: ABC-123
   Planned Date: 2026-02-13
   Initial Issue: Battery low

... (more work orders)

✓ Test 2: Grouping work orders by date...
  ✅ Grouped work orders:
     - Today: 1 work orders
     - Upcoming: 2 work orders
     - Overdue: 0 work orders

✓ Test 3: Fetching single work order...
  ✅ Successfully fetched work order

🎉 SUCCESS! Airtable integration is working!
```

### If No Work Orders Found:
```
ℹ️  No work orders found for this technician.
   Make sure:
   1. The technician email exists in Airtable
   2. Work orders are assigned to this technician
   3. Work orders have step="SCHEDULED" and status="ON_TRACK"
```

## Troubleshooting

### Error: "AIRTABLE_API_KEY not set"
- Check `.env.local` has `AIRTABLE_API_KEY=pat...`
- Make sure the file exists in project root

### Error: "AIRTABLE_BASE_ID_DEBLOQ not set"
- Check `.env.local` has `AIRTABLE_BASE_ID_DEBLOQ=app...`
- Verify the base ID is correct

### Error: "Could not find table"
- Verify your table is named exactly "Work Orders" (case-sensitive)
- Or update the table name in `src/lib/airtable.ts` if different

### Error: "Unknown field"
- Check that field names in Airtable match exactly
- Field names are case-sensitive
- Update field names in `src/lib/airtable.ts` if needed

### No work orders returned but they exist:
- Check `step` field = "SCHEDULED" (case-sensitive)
- Check `status` field = "ON_TRACK" (case-sensitive)
- Check `technician_email` matches exactly
- Verify filters in Airtable dashboard

## Adjusting Field Names

If your Airtable uses different field names, update them in `src/lib/airtable.ts`:

```typescript
// Example: If your field is "WorkOrderID" instead of "work_order_id"
workOrderId: record.get('WorkOrderID') as string,
```

## Next Steps

Once the test passes:
1. ✅ Airtable integration is working
2. ✅ Ready to build the dashboard
3. ✅ Ready to display work orders to technicians
