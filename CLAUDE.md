# CLAUDE.md - AI Development Guide
# Emergency Reporting System for Zite Technicians

**Last Updated:** 2026-02-12
**Deadline:** Monday, February 16, 2026 (4 days)
**Status:** Foundation & Planning Complete → Ready to Build

---

## 🎯 Mission

Replace broken DronaHQ system with a web app that lets field technicians:
1. View assigned work orders
2. Complete battery swaps, maintenance, and wind audits
3. Upload photos, scan QR codes, track parts
4. Sync everything to Airtable for reporting

**Critical Success Factor:** Must be operational by Monday morning for field operations.

---

## 📋 Project Context

### The Problem
- **Current System:** Airtable (data) + Fillout (forms) + DronaHQ (broken link)
- **Impact:** Technicians can't submit work orders → Field ops blocked
- **Storage Crisis:** Airtable at 1.1TB/1TB limit
- **Timeline:** Emergency 4-day build (Thu-Sun)

### The Solution
- **New Stack:** Next.js + Supabase + n8n + S3
- **Two Airtable Bases:** DeBloq (operational data) + Reports (full form data)
- **MVP Scope:** 179 tasks, streamlined for Monday launch
- **Post-MVP:** Logging, polish, advanced features deferred to v2

---

## 🏗️ Technical Architecture

### Stack Overview
```yaml
Framework: Next.js 15 (App Router, TypeScript)
Auth: Supabase Auth (email/password)
Database: Supabase (PostgreSQL) - managed, concurrent, auto-backups
ORM: Drizzle ORM (PostgreSQL compatible)
Forms: React Hook Form + Zod validation
UI: Tailwind CSS + shadcn/ui (minimal for MVP)
File Storage:
  Day 1 (Thu): Supabase Storage (temporary, unblock development)
  Day 2+ (Fri): AWS S3 (production)
QR Scanner: @zxing/browser
Airtable:
  Read: Direct API → DeBloq base (work orders)
  Write: n8n webhook → Reports base (full data)
Workflow: n8n (retry logic, rate limiting)
Deployment: Docker → AWS Kubernetes
```

### Why These Choices?
- **Supabase over SQLite:** No K8s volumes, scales to multiple replicas, managed backups
- **Two Airtable Bases:** DeBloq at capacity, Reports base for full data (no storage limit)
- **n8n for writes:** Built-in retry, rate limiting, async processing
- **Supabase Storage → S3:** Unblock development day 1, switch to production S3 day 2

---

## 🗄️ Database Schema

### Supabase Tables (PostgreSQL)

```typescript
// work_orders
{
  id: serial primary key,
  workOrderId: text unique not null,
  technicianUserId: text not null, // Supabase auth.users.id
  status: text not null, // 'in_progress' | 'completed'
  workType: text not null, // 'battery_swap' | 'maintenance' | 'wind_audit'
  initialIssue: text,
  pointCode: text,
  lockerVersion: text,
  client: text,
  createdAt: timestamp default now(),
  completedAt: timestamp,
  syncedToAirtable: boolean default false
}

// form_submissions (excludes battery_swap - has its own table)
{
  id: serial primary key,
  workOrderId: integer → work_orders.id,
  formType: text not null, // 'maintenance' | 'wind_audit' | 'survey'
  formData: jsonb not null, // Full form data with embedded photo URLs
  submittedAt: timestamp default now()
}

// battery_swaps
{
  id: serial primary key,
  workOrderId: integer → work_orders.id,
  batteryPosition: text not null, // "1", "2", "3" or "bat1", "bat2", "bat3"
  oldBatterySn: text not null,
  newBatterySn: text not null,
  recordedAt: timestamp default now()
}

// parts_used
{
  id: serial primary key,
  workOrderId: integer → work_orders.id,
  formSubmissionId: integer → form_submissions.id, // Links parts to specific form
  partName: text not null,
  quantity: integer not null,
  recordedAt: timestamp default now()
}
```

**Key Points:**
- Battery swaps use separate table (structured data, not JSON)
- Form data stored as JSONB with embedded photo URLs
- Parts linked to form submissions via foreign key

---

## 🔄 Data Flow

### 1. Dashboard (Read)
```
User logs in (Supabase Auth)
  ↓
Fetch work orders from Airtable DeBloq base
  Filter: step="SCHEDULED" AND status="ON_TRACK"
  Match: technician assigned to logged-in user
  Sort: PLANNED_DATE ascending
  ↓
Display in dashboard (Today/Upcoming/Overdue)
```

### 2. Work Order Completion (Write)
```
User completes forms + uploads photos
  ↓
Save to Supabase (immediate persistence)
  work_orders, form_submissions, battery_swaps, parts_used
  ↓
On complete: POST to n8n webhook
  {
    workOrderId,
    formSubmissions: [{ localId, formType, formData, ... }],
    batterySwaps: [...],
    partsUsed: [{ localId, partName, quantity }]
  }
  ↓
n8n workflow:
  1. Update DeBloq base (work order status only)
  2. Create Form Submissions in Reports base (store Airtable IDs)
  3. Create Battery Swaps in Reports base
  4. Map localId → Airtable ID for parts linking
  5. Create Parts Used in Reports base (linked records)
  ↓
Mark syncedToAirtable=true in Supabase
```

**Critical:** `localId` in payload is Supabase record ID. n8n must map to Airtable record IDs when creating linked records.

---

## 📝 Form Configuration System

All form behavior is driven by `lib/formConfig.ts`:

```typescript
export const FORM_CONFIG = {
  battery_swap: {
    name: "Battery Swap",
    component: "BatterySwapForm",
    repeatable: false,              // Can only add once per WO
    requiresPartsTracking: false,   // No parts for battery swap (MVP)
    canCombineWithOthers: false,    // Standalone only for MVP
    requiresCategory: false
  },

  maintenance: {
    name: "Maintenance",
    component: "MaintenanceForm",   // ONE component for ALL categories
    repeatable: true,                // Can add multiple (one per category)
    requiresPartsTracking: true,
    canCombineWithOthers: true,
    requiresCategory: true,
    categories: [
      { value: "compartment_does_not_open", label: "Compartment Does Not Open" },
      { value: "screen_is_black", label: "Screen Is Black" },
      { value: "printer_does_not_work", label: "Printer Does Not Work" },
      { value: "battery_under_voltage", label: "Battery Under Voltage" },
      { value: "scanner_does_not_work", label: "Scanner Does Not Work" },
      { value: "screen_not_responsive", label: "Screen Not Responsive" },
      { value: "hypercare", label: "Hypercare" },
      { value: "all_retrofit", label: "All Retrofit" },
      { value: "other", label: "Other" }
    ]
  },

  wind_audit: {
    name: "Wind Audit",
    component: "WindAuditForm",
    repeatable: false,              // One per WO
    requiresPartsTracking: true,    // Can use parts
    canCombineWithOthers: true,     // Can mix with maintenance
    requiresCategory: false
  },

  survey: {
    name: "Survey",
    component: "SurveyForm",
    repeatable: false,
    requiresPartsTracking: false,
    canCombineWithOthers: true,
    requiresCategory: false
    // MVP: Placeholder only, minimal implementation
  }
};
```

**To Add New Form Type:** Just add entry to config + create component. Flow logic auto-adjusts.

---

## 🔐 Security Requirements

### Authentication & Authorization
```typescript
// Every API route must check:
const { data: { user } } = await supabase.auth.getUser();
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

// Every work order operation must verify ownership:
const workOrder = await db.query.workOrders.findFirst({
  where: eq(workOrders.id, id)
});
if (workOrder.technicianUserId !== user.id) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Supabase Row Level Security (RLS)
```sql
-- work_orders: Users can only read/write their own WOs
CREATE POLICY "Users can only access their work orders"
  ON work_orders
  FOR ALL
  USING (auth.uid() = technician_user_id);

-- form_submissions: Users can only access forms for their WOs
CREATE POLICY "Users can only access their form submissions"
  ON form_submissions
  FOR ALL
  USING (
    work_order_id IN (
      SELECT id FROM work_orders WHERE technician_user_id = auth.uid()
    )
  );
```

### File Upload Validation
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Invalid file type');
}
```

### n8n Webhook Authentication
```typescript
// App sends secret header
headers: {
  'X-Webhook-Secret': process.env.N8N_WEBHOOK_SECRET
}

// n8n validates before processing
```

---

## 🎨 Code Patterns & Standards

### API Route Pattern
```typescript
// app/api/work-orders/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { db } from '@/lib/db';
import { workOrders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Fetch data
    const workOrder = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, parseInt(params.id))
    });

    // 3. Authorization check
    if (workOrder.technicianUserId !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Return data
    return Response.json({ workOrder });
  } catch (error) {
    console.error('Failed to fetch work order:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Component Pattern
```typescript
// components/forms/MaintenanceForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileUpload } from '@/components/FileUpload';
import { uploadFile } from '@/lib/storage';

const schema = z.object({
  reportingCategory: z.string().min(1, 'Category required'),
  issueDescription: z.string().min(10, 'Description too short'),
  // ... more fields
});

export function MaintenanceForm({ workOrderId, onComplete }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    // Upload photos first
    const photoUrls = await Promise.all(
      data.photos.map(file => uploadFile(file))
    );

    // Save to Supabase
    const response = await fetch(`/api/work-orders/${workOrderId}/form-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formType: 'maintenance',
        formData: { ...data, photos: photoUrls }
      })
    });

    if (response.ok) onComplete();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### File Storage Abstraction
```typescript
// lib/storage.ts
// DAY 1: Supabase Storage
export async function uploadFile(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('work-order-photos')
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('work-order-photos')
    .getPublicUrl(fileName);

  return publicUrl;
}

// DAY 2: Switch to S3 (just swap this function, rest of app unchanged)
export async function uploadFile(file: File): Promise<string> {
  const presigned = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, fileType: file.type })
  }).then(r => r.json());

  await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });

  return presigned.publicUrl;
}
```

---

## 🚫 What NOT to Do

### Prohibited Actions
- ❌ **Don't use edge runtime** - Drizzle needs Node.js runtime
- ❌ **Don't skip auth checks** - Every API route must verify user
- ❌ **Don't hardcode config** - Use `lib/formConfig.ts` for form rules
- ❌ **Don't write to DeBloq base** - Only read from it, write to Reports base
- ❌ **Don't use SQLite** - We switched to Supabase PostgreSQL
- ❌ **Don't use Clerk** - We use Supabase Auth
- ❌ **Don't commit without testing** - Test locally first
- ❌ **Don't add emojis** - Keep code and commits professional
- ❌ **Don't over-engineer** - MVP only, defer polish to v2

### Deferred to v2
- Pino/Sentry logging (use console.log for MVP)
- Survey form (placeholder only)
- Advanced mobile optimization (functional is enough)
- Offline mode / service workers
- PDF generation (store JSON only)
- Email/Slack notifications
- Multi-form mixing for battery swap (standalone only)

---

## 📦 Environment Variables

```env
# Supabase (CRITICAL - Day 1)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Airtable (CRITICAL - Day 1)
AIRTABLE_API_KEY=key...
AIRTABLE_BASE_ID_DEBLOQ=app...      # Existing base (read only)
AIRTABLE_BASE_ID_REPORTS=app...     # NEW base (full data)

# n8n (CRITICAL - Day 1/2)
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/complete-work-order
N8N_WEBHOOK_SECRET=...

# AWS S3 (Day 2)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=zite-technician-photos

# App
NEXT_PUBLIC_APP_URL=https://reports.bloqit.io
```

---

## 🔄 Development Workflow

### Day-to-Day Process

1. **Check Task List**
   ```bash
   # See all tasks and their status
   Use TaskList tool to view current tasks
   ```

2. **Claim Next Task**
   ```bash
   # Update task to in_progress before starting
   TaskUpdate(taskId: "X", status: "in_progress")
   ```

3. **Implement Feature**
   - Write code following patterns above
   - Test locally (npm run dev)
   - Verify in browser/mobile viewport

4. **Complete Task**
   ```bash
   # Mark task as completed
   TaskUpdate(taskId: "X", status: "completed")
   ```

5. **Commit Changes**
   ```bash
   git add [specific files]
   git commit -m "feat: brief description

   Completes TASK-XXX

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

6. **Report Progress**
   - Update user on completed task
   - Mention any blockers or questions
   - Suggest next task or ask for direction

### Testing Checklist Before Marking Complete

- [ ] Code compiles without errors
- [ ] API route returns expected response
- [ ] Form validation works
- [ ] Auth checks in place
- [ ] Mobile viewport tested (basic)
- [ ] Console has no errors
- [ ] Follows security patterns

### When to Ask User

**Always Ask About:**
- Missing credentials or configuration
- Ambiguous requirements
- Architecture decisions not in this doc
- Breaking changes to existing features
- Deployment issues

**Don't Ask About:**
- Code structure (follow patterns above)
- Styling details (functional > pretty for MVP)
- Error messages (be clear and helpful)
- Testing approach (basic functional testing is fine)

---

## 📊 Progress Tracking System

### Task Management

**Use built-in task system:**
```typescript
// When starting work session
TaskList() // See all tasks

// When starting a task
TaskUpdate({
  taskId: "042",
  status: "in_progress"
})

// When completing a task
TaskUpdate({
  taskId: "042",
  status: "completed"
})

// If blocked
TaskCreate({
  subject: "Investigate Supabase connection issue",
  description: "TASK-042 blocked: getting auth errors...",
  activeForm: "Investigating auth issue"
})
```

**CRITICAL: Update mvp-plan.md for each completed task:**
1. Mark task checkbox as `[x]` in `/docs/planning/mvp-plan.md`
2. Create a git commit for each completed task
3. Commit message format:
   ```
   feat: complete TASK-XXX - brief description

   - Task details
   - What was implemented

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   ```

**Example workflow:**
```bash
# 1. Complete task in code
# 2. Update mvp-plan.md (mark [x])
# 3. Commit everything
git add .
git commit -m "feat: complete TASK-001 to TASK-004 - project setup

- Initialized Next.js 15 with TypeScript
- Installed all core dependencies (Supabase, Drizzle, forms, QR, UI)
- Configured environment variables
- Set up TypeScript path aliases

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### Daily Check-in Format

**End of each session, report:**
```markdown
## Progress Report - [Day/Time]

### ✅ Completed Today
- TASK-042: Dashboard page created
- TASK-043: Work order list API route implemented
- TASK-044: Airtable integration working

### 🚧 In Progress
- TASK-045: WorkOrderCard component (80% done)

### 🚫 Blocked
- None

### 📝 Notes
- Supabase auth working smoothly
- Need S3 credentials for tomorrow (switching from Supabase Storage)

### ⏭️ Next Up
- TASK-045: Finish WorkOrderCard
- TASK-046: Create WorkOrderList component
```

### Milestone Tracking

**Key Milestones:**
- [ ] **M1: Foundation Complete** (TASK-001 to TASK-037)
  - Next.js initialized
  - Supabase connected
  - Database migrated
  - File storage working

- [ ] **M2: Dashboard Live** (TASK-038 to TASK-045)
  - Can log in
  - See work orders from Airtable
  - Navigate to work order detail

- [ ] **M3: Forms Working** (TASK-046 to TASK-097)
  - All three forms functional
  - Photos uploading
  - QR scanner working
  - Data saving to Supabase

- [ ] **M4: Completion Flow** (TASK-098 to TASK-124)
  - Multi-form support
  - Parts tracking
  - n8n sync working

- [ ] **M5: Production Ready** (TASK-125 to TASK-179)
  - Deployed to K8s
  - Mobile tested
  - Security verified
  - All 16 success criteria met

### Blocker Escalation

**If blocked for >30 min:**
1. Document the blocker clearly
2. Try alternative approach
3. Search docs/Stack Overflow
4. Ask user with context:
   ```
   BLOCKED: [Brief description]

   Task: TASK-042 (Dashboard page)
   Issue: Supabase auth hook returning null
   Tried: [what you tried]
   Error: [exact error message]
   Question: [specific question]
   ```

---

## 🎯 Success Criteria (Must Complete by Monday)

- [ ] **SUCCESS-001:** Accessible via https://reports.bloqit.io
- [ ] **SUCCESS-002:** Technicians can log in with Supabase Auth (email/password)
- [ ] **SUCCESS-003:** Dashboard shows assigned work orders from DeBloq base
- [ ] **SUCCESS-004:** Can complete Battery Swap work orders (standalone)
- [ ] **SUCCESS-005:** Can complete Maintenance work orders (single category)
- [ ] **SUCCESS-006:** Can complete Maintenance work orders (multiple categories)
- [ ] **SUCCESS-007:** Can complete Wind Audit work orders
- [ ] **SUCCESS-008:** Can mix form types (maintenance + wind audit)
- [ ] **SUCCESS-009:** Parts tracking works for maintenance and wind audit
- [ ] **SUCCESS-010:** Photos upload successfully (Supabase Storage → S3)
- [ ] **SUCCESS-011:** QR scanner works for battery serial numbers
- [ ] **SUCCESS-012:** All data saves to Supabase (PostgreSQL)
- [ ] **SUCCESS-013:** Completed work orders sync to Airtable Reports base via n8n
- [ ] **SUCCESS-014:** Works on mobile devices (iOS and Android)
- [ ] **SUCCESS-015:** Errors handled gracefully with user-friendly messages
- [ ] **SUCCESS-016:** Security implemented (RLS, webhook auth, file validation)

---

## 🚨 Critical Constraints

### Time
- **Deadline:** Monday, Feb 16, 2026 morning
- **No extensions** - Field ops depend on this
- **Prioritize ruthlessly** - Feature complete > polished

### Scope
- **Battery Swap:** Standalone only (no multi-form mixing)
- **Logging:** Console.log only (no Pino/Sentry)
- **Mobile:** Functional only (no optimization)
- **Survey:** Placeholder component only

### Technical
- **Single Supabase project** - Don't create multiple
- **Two Airtable bases** - DeBloq (read) + Reports (write)
- **n8n for all writes** - Never write directly to Airtable from app
- **Node runtime required** - Don't use edge runtime

---

## 📚 Key Documentation

- **Full Spec:** `/docs/planning/spec.md` (architecture, flows, detailed requirements)
- **Task List:** `/docs/planning/mvp-plan.md` (179 tasks, prerequisites, success criteria)
- **This File:** `/CLAUDE.md` (AI development guide, patterns, workflows)

---

## 🤝 Human Review Checkpoints

**User reviews code at:**
1. End of each major milestone (M1-M5)
2. Before deployment to K8s
3. Before marking any success criterion as complete
4. When explicitly requested

**User provides:**
- Credentials (Supabase, Airtable, n8n, S3, K8s)
- Requirements clarification
- Approval for architectural changes
- Final testing and sign-off

---

## 💡 Pro Tips for AI Agents

1. **Read this file first** before starting any task
2. **Follow patterns exactly** - consistency > creativity for MVP
3. **Test incrementally** - don't write 500 lines then test
4. **Use task system** - helps user track progress
5. **Commit frequently** - small, focused commits
6. **Report blockers early** - don't spin for hours
7. **Mobile-test constantly** - this is for field technicians
8. **Security first** - auth checks are non-negotiable
9. **Ask when unsure** - 5 min clarification > 2 hours wrong direction
10. **Ship over perfect** - working MVP Monday > perfect app Tuesday

---

## 🎬 Ready to Build?

**You have everything you need:**
- ✅ Clear architecture
- ✅ Database schema
- ✅ Code patterns
- ✅ Security requirements
- ✅ 179 task breakdown
- ✅ Progress tracking system
- ✅ Success criteria

**Waiting on:**
- ⏳ Supabase credentials
- ⏳ Airtable Reports base creation
- ⏳ n8n webhook URL

**When credentials arrive → Start TASK-001 immediately!**

---

*This document is the source of truth. When in doubt, refer to this file.*
*Last updated: 2026-02-12 by Claude Sonnet 4.5*
