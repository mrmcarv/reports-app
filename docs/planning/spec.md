# Emergency Reporting System - Implementation Spec

## Context

**Problem:** DronaHQ (current system linking Airtable + Fillout) is broken. Technicians cannot submit work orders, blocking field operations.

**Timeline:** Must be operational by Monday morning (built Thu-Sun, ~3 days)

**Solution:** Build a new web app from scratch to replace DronaHQ with full control over forms, data persistence, and reporting.

---

## Requirements Summary

**Current System (Broken):**
- Airtable automation sends daily emails at 8PM with work orders
- DronaHQ was the app interface (now broken)
- Fillout was handling forms (we're replacing this with custom forms)
- Reports stored in Airtable (1.1TB/1TB limit reached - need new approach)

**What We're Building:**
1. Web app for technicians to view and complete work orders
2. Supabase persistence layer (PostgreSQL) before syncing to Airtable
3. Three work order types with custom built-in forms (no Fillout)
4. Photo upload capability with S3 storage
5. Integration with Airtable for writing completion data
6. QR code scanner for battery serial numbers

**Work Order Assignment:**
- Work orders managed in Airtable by Technician Managers
- Technicians table exists (with teams)
- Work orders linked to technicians
- App displays work orders directly (no email dependency)
- URL params optional (for direct links/sharing)

**Work Order Types & Forms:**
- `WO_TYPE` from Airtable suggests initial form, but doesn't restrict what can be added
- Technicians can add multiple interventions/forms to any WO:
  - Maintenance forms (repeatable, one per reporting category)
  - Wind Audit form (addable to any WO)
  - Battery Swap form (currently standalone, future: combinable)
- Flexibility: Start with maintenance, add wind audit, add more maintenance, etc.

---

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Auth:** Supabase Auth (email/password, magic links)
- **Database:** Supabase (PostgreSQL) - managed, concurrent writes, auto-backups
- **ORM:** Drizzle ORM (PostgreSQL compatible)
- **Forms:** React Hook Form + Zod validation
- **UI:** Tailwind CSS + shadcn/ui components
- **File Storage:**
  - **Day 1 (Thu):** Supabase Storage (temporary - unblock development)
  - **Day 2 (Fri):** Switch to AWS S3 (production)
- **QR Scanner:** @zxing/browser (client-side)
- **Airtable Integration:**
  - Read (Dashboard): Direct API to DeBloq base
  - Write (Completion): n8n webhooks to Reports base (new base for full data)
- **Workflow Automation:** n8n (already available and linked to Airtable)
- **Logging:** Console logging for MVP (pino deferred to v2)
- **Containerization:** Docker
- **Deployment:** AWS Kubernetes (simplified - no persistent volumes needed)

---

## Architecture: Configuration-Driven Forms

**Key Requirement:** Must be easy to add new form types and change rules without major code changes

### Form Configuration System

```typescript
// lib/formConfig.ts
export const FORM_CONFIG = {
  battery_swap: {
    name: "Battery Swap",
    component: "BatterySwapForm",
    repeatable: false,                    // Can only add once per WO
    requiresPartsTracking: false,         // No parts tracking (currently)
    canCombineWithOthers: false,          // Standalone WO (future: true)
    requiresCategory: false,
  },

  maintenance: {
    name: "Maintenance",
    component: "MaintenanceForm",          // Single reusable template!
    repeatable: true,                      // Can add multiple (one per category)
    requiresPartsTracking: true,
    canCombineWithOthers: true,
    requiresCategory: true,                // Must select reporting category
    categories: [                          // Dropdown options
      { value: "compartment_does_not_open", label: "Compartment Does Not Open" },
      { value: "screen_is_black", label: "Screen Is Black" },
      { value: "printer_does_not_work", label: "Printer Does Not Work" },
      { value: "battery_under_voltage", label: "Battery Under Voltage" },
      { value: "scanner_does_not_work", label: "Scanner Does Not Work" },
      { value: "screen_not_responsive", label: "Screen Not Responsive" },
      { value: "hypercare", label: "Hypercare" },
      { value: "all_retrofit", label: "All Retrofit" },
      { value: "other", label: "Other (specify)" },
    ],
  },

  wind_audit: {
    name: "Wind Audit",
    component: "WindAuditForm",
    repeatable: false,                     // One per WO
    requiresPartsTracking: true,
    canCombineWithOthers: true,            // Can add to maintenance WO
    requiresCategory: false,
  },

  survey: {                                // NEW - Easy to add!
    name: "Survey",
    component: "SurveyForm",
    repeatable: false,
    requiresPartsTracking: false,          // Surveys don't need parts
    canCombineWithOthers: true,
    requiresCategory: false,
  },
};

export type FormType = keyof typeof FORM_CONFIG;
```

### Usage in Components

```typescript
// Add intervention button logic
const availableForms = Object.entries(FORM_CONFIG)
  .filter(([type, config]) => {
    // Filter based on current WO state
    if (!config.repeatable && alreadyHasForm(type)) return false;
    if (!config.canCombineWithOthers && completedForms.length > 0) return false;
    return true;
  })
  .map(([type, config]) => ({
    type,
    label: config.name,
  }));

// Render form based on config
const FormComponent = FORM_COMPONENTS[config.component];
<FormComponent
  requiresCategory={config.requiresCategory}
  categories={config.categories}
/>

// Parts tracking logic
const formsNeedingParts = completedForms.filter(form =>
  FORM_CONFIG[form.formType].requiresPartsTracking
);
```

### Benefits

✅ **Add new form type:**
1. Add entry to `FORM_CONFIG`
2. Create form component (e.g., `SurveyForm.tsx`)
3. Done! No changes to flow logic

✅ **Change rules:**
1. Edit config (e.g., set `battery_swap.requiresPartsTracking: true`)
2. Behavior updates automatically

✅ **Reusable templates:**
- Maintenance form is ONE component
- Reused for all reporting categories
- Category passed as prop

✅ **Consistent behavior:**
- Rules enforced by config
- No scattered if/else logic
- Single source of truth

---

## MVP Scope

### In Scope (Must Have)
- ✓ Supabase Authentication (email/password)
- ✓ Dashboard showing assigned work orders
- ✓ Read work orders from Airtable DeBloq base (filtered by technician)
- ✓ Supabase persistence layer (PostgreSQL)
- ✓ 3 work order types: Battery Swap, Wind Audit, Maintenance
- ✓ Custom built-in forms (no Fillout)
- ✓ QR code scanner for battery swaps
- ✓ Photo uploads to S3 (Supabase Storage day 1)
- ✓ Write completions to Airtable Reports base via n8n
- ✓ Store form data as JSONB (for future PDF generation)
- ✓ Docker containerization for K8s
- ✓ Mobile-responsive design

### Out of Scope (Defer to v2)
- ✗ Sync queue with retry logic (manual retry for MVP)
- ✗ Slack notifications
- ✗ Email notifications (evaluate later)
- ✗ Actual PDF generation (just store JSON)
- ✗ Offline mode / service worker
- ✗ Complex form validation
- ✗ Advanced work order search/filters
- ✗ User management / admin panel
- ✗ Work order reassignment
- ✗ Real-time updates (manual refresh for MVP)

---

## Database Schema (Supabase PostgreSQL + Drizzle)

```typescript
import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

// work_orders table
export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  workOrderId: text('work_order_id').notNull().unique(),
  technicianUserId: text('technician_user_id').notNull(), // Supabase auth.users.id
  status: text('status').notNull(), // 'in_progress' | 'completed'
  workType: text('work_type').notNull(), // 'battery_swap' | 'maintenance' | 'wind_audit' | 'survey'
  initialIssue: text('initial_issue'),
  pointCode: text('point_code'),
  lockerVersion: text('locker_version'),
  client: text('client'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  syncedToAirtable: boolean('synced_to_airtable').default(false),
});

// form_submissions table (excludes battery_swap - has its own table)
export const formSubmissions = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').notNull().references(() => workOrders.id),
  formType: text('form_type').notNull(), // 'maintenance' | 'wind_audit' | 'survey'
  formData: jsonb('form_data').notNull(), // JSONB with embedded photo URLs
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
});

// battery_swaps table
export const batterySwaps = pgTable('battery_swaps', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').notNull().references(() => workOrders.id),
  batteryPosition: text('battery_position').notNull(), // "1", "2", "3" or "bat1", "bat2", "bat3"
  oldBatterySn: text('old_battery_sn').notNull(),
  newBatterySn: text('new_battery_sn').notNull(),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
});

// parts_used table
export const partsUsed = pgTable('parts_used', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id').notNull().references(() => workOrders.id),
  formSubmissionId: integer('form_submission_id').references(() => formSubmissions.id), // Links parts to specific form/job
  partName: text('part_name').notNull(),
  quantity: integer('quantity').notNull(),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
});
```

**Key Differences from SQLite:**
- ✅ `pgTable` instead of `sqliteTable`
- ✅ `serial` for auto-increment IDs (instead of `integer`)
- ✅ `timestamp` for dates (instead of `text`)
- ✅ `jsonb` for JSON data (native PostgreSQL type, better performance)
- ✅ `boolean` native type (instead of integer mode)
- ✅ `.defaultNow()` for automatic timestamps
- ✅ `technicianUserId` matches Supabase auth.users.id (UUID)

---

## Data Storage Flow

### Understanding Form Types vs Database Tables

**Battery Swaps (Separate Table):**
- ✅ Saved to: `battery_swaps` table
- ✅ API route: `POST /api/work-orders/[id]/battery-swaps`
- ✅ Each battery swap creates one row with: batteryPosition, oldBatterySn, newBatterySn
- ❌ NOT saved to `form_submissions` table
- **Why separate?** Battery swaps have structured data (position, SNs), not freeform JSON

**All Other Forms (form_submissions Table):**
- ✅ Saved to: `form_submissions` table
- ✅ API route: `POST /api/work-orders/[id]/form-submission`
- ✅ Form types: `maintenance`, `wind_audit`, `survey`
- ✅ Each form submission creates one row with: formType, formData (JSON), submittedAt

**Visual Summary:**
```
Work Order WO-12345
│
├── Battery Swaps (battery_swaps table)
│   ├── Row 1: batteryPosition="bat1", oldSN="ABC", newSN="XYZ"
│   └── Row 2: batteryPosition="bat2", oldSN="DEF", newSN="UVW"
│
├── Form Submissions (form_submissions table)
│   ├── Row 1: formType="maintenance", formData={reportingCategory: "screen_is_black", ...}
│   ├── Row 2: formType="maintenance", formData={reportingCategory: "printer_does_not_work", ...}
│   └── Row 3: formType="wind_audit", formData={siteCheck: {...}, windAudit: {...}}
│
└── Parts Used (parts_used table)
    ├── Row 1: formSubmissionId=1, partName="LCD Screen", quantity=1
    └── Row 2: formSubmissionId=2, partName="Printer Cable", quantity=2
```

**Key Points:**
1. **formType** never includes `battery_swap` (only `maintenance`, `wind_audit`, `survey`)
2. Battery swaps and forms use different API routes
3. Parts are linked to form submissions via `formSubmissionId` (not to battery swaps currently)
4. A single work order can have multiple battery swaps AND multiple form submissions

---

## Dashboard Design

### Work Order List View

**Header:**
- User name (from Supabase Auth)
- Logout button
- Refresh button

**Work Order Cards (grouped):**

**Today:**
- Work orders with PLANNED_DATE = today
- Highlighted/priority styling

**Upcoming:**
- Work orders with PLANNED_DATE > today
- Sorted by date

**Overdue (if any):**
- Work orders with PLANNED_DATE < today
- Warning styling

**Each Card Shows:**
- WO ID (e.g., "WO-12345")
- Type badge (Battery Swap / Wind Audit / Maintenance)
- Client name
- Location (Point Code)
- Planned date
- Status indicator
- "Start Work" button

**Card Actions:**
- Click anywhere → Opens work order form
- Swipe/long-press → Quick actions (future: reschedule, notes)

**Empty States:**
- No work orders today: "No work scheduled for today"
- All complete: "All work orders completed! 🎉"

---

## Form Structures (Simplified from Fillout)

### 1. Battery Swap Form
**Purpose:** Quick battery replacement tracking

**Fields:**
- Work Order Info (auto-filled): WO ID, Client, Point Code
- Battery Swaps (repeatable, can add 1-3 entries):
  - **Battery Position** (dropdown/select: "1", "2", "3" or "bat1", "bat2", "bat3")
  - Old Battery SN (text + QR scanner button)
  - New Battery SN (text + QR scanner button)
  - [Add Another Battery]
- Notes (optional textarea)
- Photos (optional multi-file upload)
- [Complete Work Order]

**Important:**
- Battery positions are **manually selected** (technician chooses which battery to replace)
- **Variable quantity:** Some lockers have 2 batteries, some have 3
- **No duplicates:** Each position can only be replaced once per work order
- Validation: Can't have two swaps with same battery position

**API Request Example:**
```json
POST /api/work-orders/WO-12345/battery-swaps
{
  "swaps": [
    {
      "batteryPosition": "bat2",
      "oldBatterySn": "BAT-5678",
      "newBatterySn": "BAT-9012"
    },
    {
      "batteryPosition": "bat3",
      "oldBatterySn": "BAT-5679",
      "newBatterySn": "BAT-9013"
    }
  ],
  "notes": "Routine replacement - batteries 2 and 3",
  "photos": [
    "https://s3.../before-swap.jpg",
    "https://s3.../after-swap.jpg"
  ]
}
```

**Flow:** Fill → Submit → Done (no parts tracking)

### 2. Wind Audit Form
**Purpose:** Preventive maintenance and wind damage assessment

**Sections (collapsible, single-page):**

**Site Check:**
- Site Condition (dropdown)
- Site Access (multiple choice checkboxes)
- Issues Found (multiple choice checkboxes)
- Site Photos (multi-file upload)
- Technician (record picker / auto-fill)
- Access Code/Notes (text)
- Additional Notes (textarea)

**Wind Audit:**
- Wind Damage Present? (multiple choice)
- Damage Description (textarea)
- Damage Type (multiple choice checkboxes)
- Damage Photos (multi-file upload - multiple sections)
- Structural Issues (multiple choice checkboxes)

**Locker Before (Pre-work):**
- Before Photos (multi-file upload)
- Battery Serial Number (text)
- Battery Voltage (number input)
- Battery Condition Photos (multi-file upload)
- Battery Issues (multiple choice)

**Locker Test (Post-work):**
- Test Photos (multi-file upload - door, panel, cables, connections, etc.)
- Door Test Result (multiple choice)
- Panel Test Result (multiple choice)
- All Systems Working? (multiple choice)

**Ground & Plexo Test:**
- Ground Connection Test (multiple choice)
- Ground Photos (multi-file upload)
- Plexo Condition Photos (multi-file upload)

**Completion:**
- Final Notes (textarea)
- Work Complete (auto-set)

### 3. Maintenance Form (Reusable Template)
**Purpose:** General maintenance and maintenances - ONE component for ALL reporting categories

**IMPORTANT:** This is a **reusable template** used for all maintenance interventions
- The SAME form component is used for all reporting categories
- Technician selects category from dropdown (e.g., "compartment_does_not_open", "screen_is_black")
- Can add multiple instances (one per issue) to the same Work Order
- Example: WO-12345 might have 3 maintenance forms with different categories

**Template Reusability:**
- **NOT** different forms per category
- **ONE** MaintenanceForm component
- Category selected via dropdown at start of form
- Form fields are the same regardless of category

**UI Flow After Completing a Maintenance:**
```
┌─────────────────────────────────────┐
│ Maintenance Completed ✓                  │
├─────────────────────────────────────┤
│ Issue: Compartment Does Not Open    │
│ Status: Resolved                    │
├─────────────────────────────────────┤
│ What would you like to do next?     │
│                                     │
│ [Add Another Maintenance]                │
│ [Go to Parts Tracking]              │
└─────────────────────────────────────┘
```

**Work Order Progress Tracker:**
```
Work Order: WO-12345

Completed Forms:
✓ Maintenance 1: Compartment Does Not Open
✓ Maintenance 2: Screen Is Black
→ Currently working on: Maintenance 3

[Add Another Maintenance] [Finish & Track Parts]
```

**Sections:**

**Issue Identification:**
- **Reporting Category** (dropdown or from initial issue)
  - Examples: compartment_does_not_open, screen_is_black, printer_does_not_work, battery_under_voltage, scanner_does_not_work, etc.
- Issue Description (text)
- Issue Type/Severity (dropdown)

**Initial Assessment:**
- Site Photos - Before (multi-file upload)
- Issue Confirmed? (yes/no)
- Actual Issue (text if different from initial)
- Root Cause (text)

**Work Performed:**
- Maintenance Actions Taken (checkboxes)
- Work Description (textarea - detailed description of maintenance)
- Work-in-Progress Photos (multi-file upload)

**Completion:**
- After Photos (multi-file upload)
- Issue Resolved? (yes/partially/no)
- Testing Performed (text)
- Additional Issues Found? (yes/no)
  - If yes: Description (text) - may trigger another maintenance form
- Completion Notes (textarea)

### 4. Parts Tracking Page (Consolidated - End of Flow)
**Purpose:** Track parts used for each completed form/job in one place

**When Shown:** After all interventions/forms are completed, before final work order completion

**Important:**
- All form types can have parts (Maintenance, Wind Audit)
- Battery Swap currently doesn't track parts, but may in the future
- If WO has ONLY battery swap (current typical case), skip parts tracking

**Layout:** One section per completed form (collapsible/expandable)

**Each Section Shows:**
- Form type and number (e.g., "1. Wind Audit", "2. Maintenance: Replace Screen")
- Form details (issue, location, completion time)
- Parts list for that specific form:
  - Part Name (text input)
  - Quantity (number input)
  - [+ Add Part] button
  - [Remove] for each part
- Sections can be left empty (no parts used)

**Example UI:**
```
┌─────────────────────────────────────┐
│ Parts Tracking - WO-12345           │
├─────────────────────────────────────┤
│ ▼ 1. Wind Audit                     │
│   Completed: 10:30 AM               │
│   Parts:                            │
│   • Screw (qty: 4)                  │
│   • Bracket (qty: 1)                │
│   [+ Add Part]                      │
├─────────────────────────────────────┤
│ ▼ 2. Maintenance: Replace Screen         │
│   Completed: 11:15 AM               │
│   Parts:                            │
│   • Screen Assembly (qty: 1)        │
│   [+ Add Part]                      │
├─────────────────────────────────────┤
│ ▼ 3. Maintenance: Fix Wiring             │
│   Completed: 11:45 AM               │
│   Parts:                            │
│   (No parts used)                   │
│   [+ Add Part]                      │
└─────────────────────────────────────┘

[Skip - No Parts] [Complete Work Order]
```

**Benefits:**
- ✅ Less friction - complete all forms first
- ✅ Better context - review all work together
- ✅ Granular tracking - parts linked to specific forms
- ✅ Flexible - sections can be empty
- ✅ Faster workflow - no interruptions between forms

**Data Storage:**
Parts linked to specific form submissions via `formSubmissionId`:
- Wind Audit parts → formSubmissionId: 101
- Maintenance 1 parts → formSubmissionId: 102
- Maintenance 2 parts → formSubmissionId: 103 (or empty)

---

## Form Data Storage Structure

### How Photos Are Stored

**Photo URLs are embedded directly in formData** where they're relevant. This provides context about which photos belong to which form section.

**Photo Upload Flow:**
1. User selects photos in a form section (e.g., "Site Photos")
2. Photos upload to S3 → receive URLs
3. URLs stored in form state for that section
4. On submit, formData contains all answers + photo URLs in correct sections

### Example: Wind Audit Form Data

```json
{
  "formType": "wind_audit",
  "siteCheck": {
    "siteCondition": "Minor Issues",
    "siteAccess": ["gate_accessible", "parking_available"],
    "issuesFound": ["debris", "overgrowth"],
    "sitePhotos": [
      "https://s3.amazonaws.com/.../site-overview.jpg",
      "https://s3.amazonaws.com/.../site-entrance.jpg"
    ],
    "accessCode": "Gate code: 1234",
    "additionalNotes": "Access via back entrance"
  },
  "windAudit": {
    "windDamagePresent": "yes",
    "damageDescription": "Panel 3 has visible cracks on northeast corner. Mounting bracket shows stress fractures.",
    "damageType": ["panel_damage", "mounting_issues"],
    "damagePhotos": [
      "https://s3.amazonaws.com/.../damage-panel3.jpg",
      "https://s3.amazonaws.com/.../damage-closeup.jpg",
      "https://s3.amazonaws.com/.../mount-damage.jpg"
    ],
    "structuralIssues": ["loose_panels", "damaged_mount"]
  },
  "lockerBefore": {
    "beforePhotos": [
      "https://s3.amazonaws.com/.../before-locker.jpg"
    ],
    "batterySerialNumber": "BAT-12345",
    "batteryVoltage": 12.4,
    "batteryConditionPhotos": [
      "https://s3.amazonaws.com/.../battery-condition.jpg"
    ],
    "batteryIssues": ["low_voltage"]
  },
  "lockerTest": {
    "testPhotos": [
      "https://s3.amazonaws.com/.../test-door.jpg",
      "https://s3.amazonaws.com/.../test-panel.jpg",
      "https://s3.amazonaws.com/.../test-cables.jpg",
      "https://s3.amazonaws.com/.../test-connections.jpg"
    ],
    "doorTestResult": "pass",
    "panelTestResult": "pass",
    "allSystemsWorking": "yes"
  },
  "groundPlexoTest": {
    "groundConnectionTest": "pass",
    "groundPhotos": [
      "https://s3.amazonaws.com/.../ground-connection.jpg"
    ],
    "plexoConditionPhotos": [
      "https://s3.amazonaws.com/.../plexo-condition.jpg"
    ]
  },
  "completion": {
    "finalNotes": "All tests passed. Recommend monitoring Panel 3 for further damage.",
    "workComplete": true
  }
}
```

### Example: Maintenance Form Data (Single Maintenance)

```json
{
  "formType": "maintenance",
  "issueIdentification": {
    "reportingCategory": "screen_is_black",
    "issueDescription": "Display completely black, no response",
    "issueType": "critical"
  },
  "initialAssessment": {
    "beforePhotos": [
      "https://s3.amazonaws.com/.../before-screen.jpg",
      "https://s3.amazonaws.com/.../before-panel.jpg"
    ],
    "issueConfirmed": true,
    "actualIssue": "Display cable disconnected, not screen failure",
    "rootCause": "Loose connection due to vibration"
  },
  "workPerformed": {
    "maintenanceActionsTaken": ["reconnect_cable", "secure_connection", "test_display"],
    "workDescription": "Reconnected display cable and secured with additional zip tie. Tested all display functions.",
    "workPhotos": [
      "https://s3.amazonaws.com/.../maintenance-cable.jpg",
      "https://s3.amazonaws.com/.../maintenance-secured.jpg"
    ]
  },
  "completion": {
    "afterPhotos": [
      "https://s3.amazonaws.com/.../after-display.jpg",
      "https://s3.amazonaws.com/.../after-test.jpg"
    ],
    "issueResolved": "yes",
    "testingPerformed": "Tested all display zones, touch response, brightness",
    "additionalIssuesFound": false,
    "completionNotes": "Display now fully functional. All tests passed."
  }
}
```

### Example: Multiple Maintenances in One Work Order

**Work Order WO-12345** with 3 maintenances:

**form_submissions table:**
```
| id  | workOrderId | formType | formData (reportingCategory)         |
|-----|-------------|----------|--------------------------------------|
| 201 | WO-12345    | maintenance   | { reportingCategory: "compartment_does_not_open" } |
| 202 | WO-12345    | maintenance   | { reportingCategory: "screen_is_black" }           |
| 203 | WO-12345    | maintenance   | { reportingCategory: "printer_does_not_work" }     |
```

**Parts Tracking Page would show:**
```
Parts Tracking - WO-12345

▼ 1. Maintenance: Compartment Does Not Open
   Parts: Lock mechanism (qty: 1), Screws (qty: 4)

▼ 2. Maintenance: Screen Is Black
   Parts: Display cable (qty: 1)

▼ 3. Maintenance: Printer Does Not Work
   Parts: Printer head (qty: 1), Thermal paper (qty: 1)
```

### Example: Battery Swap (Simple)

```json
{
  "formType": "battery_swap",
  "notes": "Routine battery replacement, no issues",
  "photos": [
    "https://s3.amazonaws.com/.../old-batteries.jpg",
    "https://s3.amazonaws.com/.../new-batteries-installed.jpg"
  ]
}
```

**Note:** Battery swap details (position, old/new serial numbers) are stored in the `battery_swaps` table separately.

**Example battery_swaps records for this work order:**
```
| id | workOrderId | batteryPosition | oldBatterySn | newBatterySn | recordedAt          |
|----|-------------|-----------------|--------------|--------------|---------------------|
| 1  | WO-12345    | bat2            | BAT-5678     | BAT-9012     | 2026-02-12 10:30:00 |
| 2  | WO-12345    | bat3            | BAT-5679     | BAT-9013     | 2026-02-12 10:30:00 |
```
(Only Battery 2 and 3 were replaced in this example)

### Benefits of This Approach

✅ **Contextual:** Photos are linked to their form section
✅ **PDF-Ready:** Easy to generate reports with photos in correct sections
✅ **Simple:** One JSON blob contains everything
✅ **Flexible:** Different sections can have different photo fields
✅ **Queryable:** Can extract specific photo types (e.g., all "beforePhotos")

---

## API Routes

```
GET /api/work-orders/list ← NEW
  - Fetch work orders from Airtable for logged-in technician
  - Filter: step="SCHEDULED", status="ON_TRACK"
  - Sort: PLANNED_DATE
  - Return: WO list with metadata

POST /api/work-orders/init
  - Initialize work order from Airtable data or URL params
  - Create in Supabase if doesn't exist
  - Verify user has access to this work order
  - Return work order details

GET /api/work-orders/[id]
  - Get work order details from Supabase (or Airtable DeBloq if not local)

POST /api/work-orders/[id]/battery-swaps
  - Submit battery swaps (1-3 batteries)
  - Request body: { swaps: [{ batteryPosition, oldBatterySn, newBatterySn }], notes, photos }
  - Creates one row per swap in battery_swaps table
  - Auto-completes work order (standalone only for MVP)

POST /api/work-orders/[id]/form-submission
  - Submit maintenance or wind audit form data
  - Returns localId for parts linking

POST /api/work-orders/[id]/parts
  - Submit parts used (linked to form submissions via localId)

POST /api/work-orders/[id]/complete
  - Mark work order complete in Supabase
  - Call n8n webhook to sync to Airtable Reports base

POST /api/upload/presigned-url
  - Get S3 presigned URL for file upload
```

---

## User Flow

### Primary Flow (Dashboard)

1. **Technician opens app** → Supabase Auth login (if not authenticated)

2. **Dashboard displays**
   - Fetch work orders from Airtable:
     - Filter: `step = "SCHEDULED"` AND `status = "ON_TRACK"`
     - Match: technician assigned to logged-in user
     - Sort: by `PLANNED_DATE`
   - Show list of work order cards (WO ID, type, client, location, date)
   - Grouped by: Today / Upcoming / Overdue

3. **Technician selects work order** → Opens appropriate flow

   **Work Order Types:**
   - `battery_swap` → Battery Swap form (standalone only for MVP)
   - `maintenance` → Maintenance WO (can have multiple interventions)
   - `wind_audit` → Wind Audit (can be added to maintenance WO)

   **Form Options Available:**
   - [Maintenance Form] - Can add multiple (one per reporting category)
   - [Wind Audit Form] - Can add as additional intervention
   - [Battery Swap Form] - Standalone only for MVP

4. **Complete interventions** (flexible flow)

   **Scenario A: Maintenance WO with multiple interventions**
   ```
   1. Add Maintenance Form #1 (compartment_does_not_open) → Save
   2. "Add Another Intervention?" → Yes
   3. Add Maintenance Form #2 (screen_is_black) → Save
   4. "Add Another Intervention?" → Yes
   5. Add Wind Audit Form → Save
   6. "Add Another Intervention?" → No, done
   → Go to Parts Tracking
   ```

   **Scenario B: Wind Audit WO**
   ```
   1. Complete Wind Audit Form → Save
   2. "Add Another Intervention?" → No
   → Go to Parts Tracking
   ```

   **Scenario C: Battery Swap (current - standalone)**
   ```
   1. Complete Battery Swap Form → Save
   → Done (no parts currently)
   ```

   **Scenario D: Future - Battery Swap + Maintenance**
   ```
   1. Complete Battery Swap Form → Save
   2. "Add Another Intervention?" → Yes
   3. Add Maintenance Form → Save
   → Go to Parts Tracking
   ```

   - Each form saves as separate `form_submission` record
   - Maintenance forms have `reportingCategory`
   - Forms can be mixed: Wind Audit + Maintenance + (future) Battery Swap

5. **Parts Tracking Page** (after all interventions completed)
   - Shows all completed forms for this work order
   - Each form has its own parts section (can be empty)
   - Sections labeled: "Maintenance: compartment_does_not_open", "Wind Audit", etc.
   - Add parts to relevant forms
   - Parts linked to specific form submissions via `formSubmissionId`
   - **Exception:** Battery Swap currently has no parts (future: may have parts)

6. **Complete Work Order**
   - Save all parts to Supabase
   - Mark work order complete
   - Sync to Airtable Reports base via n8n (work order status to DeBloq, all data to Reports)
   - Return to dashboard

### Alternative Flow (Direct Link)

**Optional:** URL params still work for direct access
- URL: `https://reports.bloqit.io/work-order/12345`
- Opens work order form directly
- Useful for sharing, notifications, or future email reminders

---

## File Structure

```
zite-technician-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx (Supabase provider)
│   │   ├── page.tsx (redirect to /dashboard)
│   │   ├── dashboard/
│   │   │   └── page.tsx (work order list) ← NEW
│   │   ├── work-order/
│   │   │   └── [id]/page.tsx (work order form)
│   │   └── api/
│   │       ├── work-orders/
│   │       │   ├── list/route.ts ← NEW (fetch from Airtable)
│   │       │   ├── init/route.ts
│   │       │   └── [id]/
│   │       │       ├── complete/route.ts
│   │       │       ├── battery-swaps/route.ts
│   │       │       ├── form-submission/route.ts
│   │       │       └── parts/route.ts
│   │       └── upload/
│   │           └── presigned-url/route.ts
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── WorkOrderCard.tsx ← NEW
│   │   │   ├── WorkOrderList.tsx ← NEW
│   │   │   └── WorkOrderFilters.tsx ← NEW
│   │   ├── forms/
│   │   │   ├── BatterySwapForm.tsx
│   │   │   ├── WindAuditForm.tsx
│   │   │   ├── MaintenanceForm.tsx (reusable template for all categories)
│   │   │   ├── SurveyForm.tsx ← NEW (example of easy extensibility)
│   │   │   └── PartsTrackingPage.tsx (consolidated parts for all forms)
│   │   ├── parts/
│   │   │   ├── FormPartsSection.tsx ← NEW (parts for one form)
│   │   │   └── PartEntry.tsx ← NEW (single part input)
│   │   ├── ui/ (shadcn)
│   │   └── FileUpload.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── schema.ts
│   │   ├── formConfig.ts ← NEW (configuration for all form types)
│   │   ├── airtable.ts (read only - dashboard) ← NEW
│   │   ├── n8n.ts (write via webhook - completion) ← NEW
│   │   ├── s3.ts
│   │   └── qr-scanner.ts
│   └── types/
│       └── index.ts
├── drizzle/
│   └── migrations/
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── Dockerfile
└── .env.local
```

---

## Docker & Kubernetes Configuration

### Dockerfile

**Key Requirements:**
- Multi-stage build for smaller image size
- Non-root user for security
- No persistent volumes needed (Supabase handles database)

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

**Note:** Much simpler than SQLite version - no data directories, no volume management!

### Kubernetes Deployment

**Deployment (k8s/deployment.yaml):**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zite-technician-app
  namespace: your-namespace
spec:
  replicas: 2 # ✅ Can scale! (PostgreSQL handles concurrency)
  selector:
    matchLabels:
      app: zite-technician-app
  template:
    metadata:
      labels:
        app: zite-technician-app
    spec:
      containers:
      - name: app
        image: your-registry/zite-technician-app:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Key Improvements:**
- ✅ No PersistentVolumeClaim needed
- ✅ No volume mounts
- ✅ Can scale to **multiple replicas** (high availability)
- ✅ Simpler deployment
- ✅ Faster pod startup (no volume attachment)

**Service (k8s/service.yaml):**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: zite-technician-app
  namespace: your-namespace
spec:
  selector:
    app: zite-technician-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

**Ingress (k8s/ingress.yaml):**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: zite-technician-app
  namespace: your-namespace
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    kubernetes.io/ingress.class: nginx
spec:
  tls:
  - hosts:
    - reports.bloqit.io
    secretName: reports-bloqit-io-tls
  rules:
  - host: reports.bloqit.io
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: zite-technician-app
            port:
              number: 80
```

**Secrets (create via kubectl):**
```bash
kubectl create secret generic app-secrets \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=... \
  --from-literal=AIRTABLE_API_KEY=... \
  --from-literal=AIRTABLE_BASE_ID_DEBLOQ=... \
  --from-literal=AIRTABLE_BASE_ID_REPORTS=... \
  --from-literal=AWS_ACCESS_KEY_ID=... \
  --from-literal=AWS_SECRET_ACCESS_KEY=... \
  --from-literal=N8N_WEBHOOK_SECRET=... \
  -n your-namespace
```

**Important Notes:**
- ✅ **Scalable:** Can run multiple replicas (PostgreSQL handles concurrency)
- 🔒 **Security:** All secrets via K8s secrets, never in deployment YAML
- 📦 **No Volumes:** Database managed by Supabase (automatic backups included)
- 🚀 **Simpler:** Fewer moving parts, faster deployments

---

## Implementation Timeline

### Day 1 (Thursday) - Foundation + Dashboard
**Goal:** Auth + database + dashboard

- [ ] Initialize Next.js 15 project
- [ ] Set up Supabase client and authentication
- [ ] Set up Drizzle ORM with Supabase PostgreSQL
- [ ] Create database schema and run migrations
- [ ] Set up Airtable API client (read from DeBloq base)
- [ ] Build dashboard page
- [ ] API: GET /api/work-orders/list (fetch from Airtable)
- [ ] Work order card components
- [ ] Basic routing (dashboard → work order)

**Deliverable:** Can log in with Supabase Auth, see dashboard with assigned work orders, click to open one

### Day 2 (Friday) - Forms
**Goal:** All three forms working

- [ ] Set up S3 integration
- [ ] Build Battery Swap form + QR scanner
- [ ] Build Wind Audit form
- [ ] Build Maintenance form
- [ ] Build Parts Tracking Page (consolidated, one section per form)
- [ ] File upload component
- [ ] Form submission API routes
- [ ] Parts API route (submit parts for multiple forms)

**Deliverable:** All forms work, save to Supabase, upload to storage (Supabase day 1, S3 day 2), parts tracking integrated

### Day 3 (Saturday) - Integration & Deploy
**Goal:** Airtable sync + deployment

- [ ] Airtable integration
- [ ] Complete work order flow
- [ ] Mobile responsive testing
- [ ] Docker containerization
- [ ] Error handling

**Deliverable:** End-to-end working, containerized

### Day 4 (Sunday) - Production
**Goal:** Deploy to K8s + testing

- [ ] Deploy to Kubernetes
- [ ] Production testing (all forms)
- [ ] Bug fixes
- [ ] Documentation

**Deliverable:** Live in production, ready for Monday

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Private service key (server-side only)

# File Storage - Day 1 (Supabase Storage - temporary)
# Uses Supabase URL above, no additional config needed

# File Storage - Day 2+ (AWS S3 - production)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=zite-technician-photos
AWS_S3_PUBLIC_URL=https://...

# Airtable - DeBloq Base (Read for dashboard)
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID_DEBLOQ=... # Main operational base

# Airtable - Reports Base (Write via n8n)
AIRTABLE_BASE_ID_REPORTS=... # New base for full report data

# n8n (Write via webhook for completion)
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/complete-work-order
N8N_WEBHOOK_SECRET=... # For webhook authentication

# Logging (MVP - just console, no env vars needed)
# LOG_LEVEL=info # Deferred to v2
# SENTRY_DSN=... # Deferred to v2

# App
NEXT_PUBLIC_APP_URL=https://reports.bloqit.io
```

---

## What We Need From You

### 1. Supabase (Today - Thursday) ⚡ PRIORITY
- [ ] Create Supabase project at supabase.com
- [ ] Get Supabase URL (Settings → API → Project URL)
- [ ] Get anon/public key (Settings → API → anon public)
- [ ] Get service role key (Settings → API → service_role secret)
- [ ] Enable email auth (Authentication → Providers → Email)

**Time estimate:** ~30 minutes
**Blocks:** Everything - needed to start development

### 2. Airtable (Today - Thursday) ⚡ PRIORITY
- [ ] API key
- [ ] **DeBloq Base ID** (existing base - for reading work orders)
- [ ] **NEW: Create "Reports" Base** for full report data storage
- [ ] Reports Base ID
- [ ] **DeBloq Base - Work Orders table:**
  - Field names: step, status, PLANNED_DATE, WO_TYPE, CLIENT, POINT_CODE, LOCKER_VERSION, INITIAL_ISSUE
  - How technician is linked (email field? linked record?)
  - Completion values (step=?, status=?)
- [ ] **DeBloq Base - Technicians table:**
  - How to match logged-in user (email field?)
- [ ] **Reports Base - Form Submissions table** (create new):
  - Fields: workOrderId (text), formType (text), formData (long text/JSON), submittedAt (datetime)
- [ ] **Reports Base - Battery Swaps table** (create new):
  - Fields: workOrderId (text), batteryPosition (text), oldBatterySn (text), newBatterySn (text), recordedAt (datetime)
- [ ] **Reports Base - Parts Used table** (create new):
  - Fields: workOrderId (text), formSubmissionId (linked record → Form Submissions), partName (text), quantity (number), recordedAt (datetime)
  - **Note:** formSubmissionId must be a "Link to another record" field type in Airtable for cross-table reporting

**Time estimate:** ~1-2 hours (includes creating Reports base + tables)
**Blocks:** Dashboard, n8n integration

### 3. n8n Webhook (Today/Tomorrow)
- [ ] n8n webhook URL
- [ ] Webhook secret for authentication
- [ ] We can help design the workflow

**Time estimate:** ~1-2 hours
**Blocks:** Work order completion flow

### 4. AWS S3 (Tomorrow - Friday)
- [ ] S3 bucket name (existing)
- [ ] IAM access key
- [ ] IAM secret key
- [ ] Region

**Time estimate:** ~15 minutes
**Blocks:** Production photo uploads (can use Supabase Storage temporarily)

### 5. Kubernetes (Saturday/Sunday)
- [ ] Cluster access (kubeconfig)
- [ ] Namespace
- [ ] Container registry credentials
- [ ] Confirm domain: reports.bloqit.io

**Time estimate:** ~30 minutes
**Blocks:** Production deployment

---

## Airtable Integration Strategy

### Read (Dashboard) - Direct Airtable API
**Why Direct API:** Fast real-time data for dashboard, no latency from webhook intermediary

**Fetch work orders for technician:**
```
GET https://api.airtable.com/v0/{baseId}/Work%20Orders
  filterByFormula: AND(
    {step} = "SCHEDULED",
    {status} = "ON_TRACK",
    {technician_email} = "[user_email]"
  )
  sort: [{field: "PLANNED_DATE", direction: "asc"}]
```

**Response:** List of work orders with:
- Work Order ID
- WO_TYPE
- CLIENT
- POINT_CODE
- LOCKER_VERSION
- INITIAL_ISSUE
- PLANNED_DATE
- Any other metadata

### Write (Completion) - n8n Webhook
**Why n8n:** Built-in retry logic, rate limiting protection, async processing, separation of concerns

**Flow:**
1. Mark work order complete in Supabase
2. POST to n8n webhook with complete work order data:
   ```json
   {
     "workOrderId": "WO-12345",
     "completedAt": "2026-02-12T10:30:00Z",
     "technicianEmail": "tech@example.com",
     "formSubmissions": [
       {
         "localId": 1,
         "formType": "maintenance",
         "reportingCategory": "screen_is_black",
         "formData": { ... },
         "submittedAt": "..."
       }
     ],
     "batterySwaps": [
       {
         "batteryPosition": "bat2",
         "oldBatterySn": "OLD123",
         "newBatterySn": "NEW456"
       }
     ],
     "partsUsed": [
       {
         "localId": 1,
         "partName": "Screen LCD",
         "quantity": 1
       }
     ]
   }
   ```
   **Note:** `localId` in payload is the Supabase record ID. n8n must map this to Airtable record IDs when linking parts to form submissions.
3. n8n workflow handles:
   - Update Work Orders table (step, status, completed_at) in DeBloq base
   - Create Form Submissions records in Reports base (store Airtable IDs)
   - Create Battery Swaps records in Reports base
   - Create Parts Used records in Reports base (link to Form Submissions via Airtable record ID)
   - Retry on failure
   - Return success/failure response
4. On success: Mark `synced_to_airtable = true` in Supabase
5. On failure: Show error, keep `synced_to_airtable = false`, allow manual retry

---

## n8n Workflow Configuration

### Required n8n Workflow: Complete Work Order

**Trigger:** Webhook (POST)
**Webhook URL:** `/webhook/complete-work-order`

**Workflow Steps:**
1. **Webhook Trigger** - Receive POST with work order data
2. **Parse JSON** - Extract workOrderId, formSubmissions, batterySwaps, partsUsed
3. **Update Work Order** (Airtable node → DeBloq base)
   - Find record by workOrderId in Work Orders table
   - Update: step="COMPLETED", status="COMPLETED", completed_at
4. **Create Form Submissions** (Airtable node → Reports base, loop)
   - Initialize mapping object: `localIdToAirtableId = {}`
   - For each formSubmission in array:
     - Create record with formType, formData (JSON), submittedAt
     - Store mapping: `localIdToAirtableId[formSubmission.localId] = airtableRecordId`
5. **Create Battery Swaps** (Airtable node → Reports base, loop)
   - For each batterySwap in array
   - Create record with batteryPosition, oldBatterySn, newBatterySn, recordedAt
6. **Create Parts Used** (Airtable node → Reports base, loop)
   - For each part in array:
     - Get Airtable form submission ID: `airtableFormId = localIdToAirtableId[part.localId]`
     - Create record with formSubmissionId (linked record), partName, quantity, recordedAt
7. **Return Response**
   - Success: `{ "success": true, "workOrderId": "..." }`
   - Error: `{ "success": false, "error": "..." }`

**Error Handling:**
- Automatic retry (3 attempts with exponential backoff)
- Error webhook/notification (optional: Slack alert)
- Return detailed error message to app

**Testing:**
Can be tested with curl:
```bash
curl -X POST https://n8n.example.com/webhook/complete-work-order \
  -H "Content-Type: application/json" \
  -d '{
    "workOrderId": "TEST-001",
    "completedAt": "2026-02-12T10:30:00Z",
    "technicianEmail": "test@example.com",
    "formSubmissions": [],
    "batterySwaps": [],
    "partsUsed": []
  }'
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| S3 setup takes too long | Use Supabase Storage temporarily (day 1), switch to S3 when ready |
| Airtable rate limits (read) | n8n handles write rate limiting, read limits unlikely |
| n8n webhook failures | Supabase keeps synced_to_airtable=false, manual retry button |
| QR scanner compatibility | Manual text input fallback |
| Supabase free tier limits | 500MB DB, 1GB storage - plenty for MVP |
| Supabase Auth mobile issues | Test early, well-supported by Supabase |

---

## Success Criteria

**By Monday, the app must:**
1. ✓ Accessible via HTTPS (reports.bloqit.io)
2. ✓ Supabase Auth login works (email/password)
3. ✓ Initialize work orders from URL or dashboard
4. ✓ Show correct forms per WO_TYPE (configurable)
5. ✓ Upload photos to S3 (or Supabase Storage)
6. ✓ QR scanning works (battery swap)
7. ✓ Save data to Supabase (PostgreSQL)
8. ✓ Sync to Airtable Reports base via n8n
9. ✓ Work on mobile (iOS/Android)
10. ✓ Handle errors gracefully

---

## Next Steps

1. **You:** Provide credentials (Supabase, S3, Airtable x2, n8n, K8s)
2. **Me:** Initialize project + foundation
3. **Iterate:** Build in phases, test each
4. **Deploy:** K8s deployment
5. **Validate:** End-to-end testing
6. **Launch:** Ready Monday morning

---

## Notes & Adjustments

### Recent Updates (2026-02-12)

**Changed: Dashboard-First Approach**
- ✅ Removed dependency on Airtable email automation
- ✅ App now reads work orders directly from Airtable
- ✅ Dashboard shows all assigned work orders (filtered by step=SCHEDULED, status=ON_TRACK)
- ✅ Work orders sorted by PLANNED_DATE
- ✅ Reduces Airtable automation load
- ✅ Better UX - technicians see all work in one place
- ✅ Email notifications deferred (can evaluate later)

**Benefits:**
- Technicians don't need to hunt through emails
- See work history and upcoming assignments
- Reduces Airtable stress
- More flexible for future features (notifications, reminders, etc.)

**Additional Time:** ~6-8 hours added to Day 1 for dashboard implementation

**Changed: Form Data Structure**
- ✅ Photo URLs now embedded directly in formData (not separate column)
- ✅ Photos stored with their relevant form sections (sitePhotos, damagePhotos, etc.)
- ✅ Better context for PDF generation
- ✅ Simpler data model - one source of truth
- ✅ Removed `photoUrls` column from `form_submissions` table

**Example structure:**
```json
{
  "siteCheck": {
    "siteCondition": "Good",
    "sitePhotos": ["url1", "url2"]
  },
  "completion": {
    "afterPhotos": ["url3", "url4"]
  }
}
```

**Changed: Battery Swaps Schema**
- ✅ Added `batteryPosition` field to track which battery was replaced
- ✅ Supports both numeric ("1", "2", "3") and custom labels ("bat1", "bat2", "bat3")
- ✅ Manual position selection (technician chooses which battery to replace)
- ✅ Variable quantity support (2 or 3 batteries per locker)
- ✅ Validation prevents duplicate positions in same work order

**Example:**
```
batteryPosition: "bat2" → Replaced battery in position 2
batteryPosition: "bat3" → Replaced battery in position 3
```

**Changed: Parts Tracking Flow**
- ✅ Added `formSubmissionId` to link parts to specific form/job
- ✅ **Consolidated parts tracking at END of flow** (not after each form)
- ✅ Single Parts Tracking Page shows all completed forms
- ✅ Each form has its own parts section (can be empty)
- ✅ Less friction - complete all forms first, then add parts
- ✅ Better UX - review all work together, easier to remember parts used

**Flow:**
```
1. Complete Wind Audit → Save
2. Complete Maintenance 1 → Save
3. Complete Maintenance 2 → Save
4. → Parts Tracking Page (one section per form)
5. Add parts to each section (or skip)
6. Complete Work Order
```

**Benefits:**
- No interruptions between forms
- Granular tracking (parts per form)
- Flexible (sections can be empty)

**Updated: Wind Audit Form Structure** (2026-02-12)
- ✅ Analyzed actual Fillout Wind Audit form ("NEW Wind Audit - V1.json")
- ✅ Form has 6 sections: Site Check, Wind Audit, Locker Before, Locker Test, Ground & Plexo Test, Completion
- ✅ Updated plan with detailed field specifications based on actual form
- ✅ Simplified from multi-step wizard to single-page collapsible sections
- ✅ Maintains all essential data collection points
- ✅ Field types: Dropdown, Multiple Choice, Text, Number, Textarea, File Upload

**Key Sections:**
1. **Site Check** - Access, condition, initial issues
2. **Wind Audit** - Damage assessment and documentation
3. **Locker Before** - Pre-work battery and system state
4. **Locker Test** - Post-work testing and validation
5. **Ground & Plexo Test** - Electrical and enclosure checks
6. **Completion** - Final notes

**Updated: Multiple Maintenances Per Work Order** (2026-02-12)
- ✅ **Critical requirement:** Single Work Order can have multiple maintenance interventions
- ✅ Each maintenance addresses a different issue (reporting category)
- ✅ Examples from current system:
  - WO with "compartment_does_not_open" + "screen_is_black" + "printer_does_not_work"
  - WO with 3x "compartment_does_not_open" (multiple compartments)
- ✅ Added **reportingCategory** field to Maintenance form
- ✅ Updated Parts Tracking to show each maintenance separately
- ✅ UI flow supports "Add Another Maintenance" functionality

**Reporting Categories (examples from image):**
- compartment_does_not_open
- screen_is_black
- printer_does_not_work
- battery_under_voltage
- scanner_does_not_work
- screen_not_responsive
- Other (with custom description)
- Hypercare
- All Retrofit

**Flow for Multiple Maintenances:**
```
1. Complete Maintenance 1: Fix compartment → Save
2. "Add Another Maintenance?" → Yes
3. Complete Maintenance 2: Fix screen → Save
4. "Add Another Maintenance?" → No, done
5. → Parts Tracking (shows both maintenances)
6. Add parts for each maintenance
7. Complete Work Order
```

**Updated: Work Order Structure Clarification** (2026-02-12)
- ✅ **Maintenance WO:** Can have multiple interventions (multiple maintenance forms, each with reportingCategory)
- ✅ **Wind Audit:** Can be ADDED as intervention to any WO (not tied to WO_TYPE)
- ✅ **Battery Swap:** Usually standalone WO, but plan for future flexibility to combine with other interventions
- ✅ **Parts Tracking:** All forms can have parts (currently battery swap doesn't, but may in future)

**Work Order Scenarios:**
1. **Pure Maintenance:** Multiple maintenance forms (different reporting categories) + parts
2. **Maintenance + Wind Audit:** Mix of form types + parts for all
3. **Pure Wind Audit:** Single wind audit form + parts
4. **Pure Battery Swap (current):** Battery swap form only, no parts
5. **Battery Swap + Maintenance (future):** Mix including battery swap + parts

**Key Insight:** Forms are independent of initial WO_TYPE. The type might suggest the first form, but technician can add any combination of interventions.

**Added: Configuration-Driven Architecture** (2026-02-12)
- ✅ **Form Configuration System** - All form types defined in `lib/formConfig.ts`
- ✅ **Easy extensibility** - Add new form types (like Survey) by adding to config + creating component
- ✅ **Easy rule changes** - Change behavior (e.g., enable battery swap parts tracking) by editing config
- ✅ **Reusable templates** - Maintenance form is ONE component used for all reporting categories
- ✅ **Consistent behavior** - Rules enforced by config, no scattered logic

**Configuration Properties:**
- `repeatable` - Can add multiple of this form type to same WO?
- `requiresPartsTracking` - Show this form in parts tracking page?
- `canCombineWithOthers` - Can exist alongside other form types?
- `requiresCategory` - Must select a reporting category?
- `categories` - List of available categories (for maintenance)

**Adding New Form Type (e.g., Survey):**
1. Add to `FORM_CONFIG` in `lib/formConfig.ts`
2. Create `SurveyForm.tsx` component
3. Done! Logic automatically handles new type

**Example - Enable Battery Swap Parts Tracking (future):**
```typescript
battery_swap: {
  ...
  requiresPartsTracking: true,  // Change from false to true
  canCombineWithOthers: true,   // Change from false to true
}
```

**Updated: Application Domain** (2026-02-12)
- ✅ App will be deployed to: `https://reports.bloqit.io`
- ✅ All URL examples updated to use correct domain
- ✅ Environment variable: `NEXT_PUBLIC_APP_URL=https://reports.bloqit.io`

---

<!-- Add your notes, questions, or adjustments below -->

