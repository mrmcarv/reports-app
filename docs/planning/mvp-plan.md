# Implementation Plan - Emergency Reporting System

**Deadline:** Monday morning (Feb 16, 2026)

---

## Prerequisites

### PREREQ-001: Supabase Setup ⚡ CRITICAL - DO TODAY
- [x] Supabase project created at supabase.com
- [x] Project URL obtained (Settings → API)
- [x] Anon/public key obtained (Settings → API)
- [x] Service role key obtained (Settings → API)
- [x] Email auth enabled (Authentication → Providers)
- [x] Database ready (automatic with project creation)

### PREREQ-002: Airtable API Access ⚡ CRITICAL - DO TODAY
- [x] API key obtained
- [x] **DeBloq Base ID** obtained (existing base)
- [x] **NEW: Reports Base created** (new base for full data)
- [x] Reports Base ID obtained
- [x] Work Orders table (DeBloq) field mappings documented
- [ ] Technicians table (DeBloq) structure documented (defer to v2)
- [x] Form Submissions table (Reports) created with fields
- [x] Battery Swaps table (Reports) created with fields
- [x] Parts Used table (Reports) created with fields

### PREREQ-003: n8n Webhook Access
- [x] n8n webhook URL obtained
- [x] Webhook secret generated
- [x] n8n workflow created (targeting Reports base)
- [x] Webhook tested with sample data (connectivity verified, Airtable sync deferred)

### PREREQ-004: AWS S3 Setup (Tomorrow - Friday)
- [ ] S3 bucket name confirmed (existing bucket)
- [ ] IAM access key obtained
- [ ] IAM secret key obtained
- [ ] Bucket region confirmed

**Note:** Using Supabase Storage temporarily today, switching to S3 tomorrow

### PREREQ-005: Kubernetes Access (Saturday/Sunday)
- [ ] Cluster access (kubeconfig) obtained
- [ ] Namespace confirmed
- [ ] Container registry credentials obtained
- [ ] Ingress/domain config for reports.bloqit.io confirmed

---

## Implementation Tasks

### Project Setup

- [x] **TASK-001:** Initialize Next.js 15 project with TypeScript
- [x] **TASK-002:** Install core dependencies:
  - Auth & DB: @supabase/supabase-js, @supabase/ssr
  - ORM: drizzle-orm, drizzle-kit, postgres (for PostgreSQL)
  - AWS (Day 2): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner
  - Forms: react-hook-form, zod
  - QR: @zxing/browser
  - UI: @shadcn/ui components
- [x] **TASK-003:** Set up environment variables (.env.local, .env.example)
- [x] **TASK-004:** Configure TypeScript paths and imports

### Supabase Setup

- [x] **TASK-005:** Create Supabase client utilities (lib/supabase/client.ts, server.ts)
- [x] **TASK-006:** Configure Supabase Auth middleware for protected routes
- [x] **TASK-007:** Create login page (app/login/page.tsx) with email/password
- [x] **TASK-008:** Test authentication flow (login/logout/session)

### Database Schema & Migrations

- [x] **TASK-009:** Create database schema file (lib/schema.ts) with PostgreSQL types
- [x] **TASK-010:** Define work_orders table (pgTable, serial, timestamp, jsonb)
- [x] **TASK-011:** Define form_submissions table
- [x] **TASK-012:** Define battery_swaps table (with batteryPosition)
- [x] **TASK-013:** Define parts_used table (with formSubmissionId)
- [x] **TASK-014:** Create Drizzle config for Supabase PostgreSQL
- [x] **TASK-015:** Run migrations to create tables in Supabase
- [x] **TASK-016:** Test database CRUD operations

### Configuration System

- [x] **TASK-017:** Create form configuration file (lib/formConfig.ts)
- [x] **TASK-018:** Define battery_swap form config
- [x] **TASK-019:** Define maintenance form config with reporting categories
- [x] **TASK-020:** Define wind_audit form config
- [x] **TASK-021:** Define survey form config (for extensibility)

### Airtable Integration (Read-only for Dashboard)

- [x] **TASK-022:** Create Airtable API client (lib/airtable.ts - read only)
- [x] **TASK-023:** Implement read work orders function (filter by technician, step, status)
- [x] **TASK-024:** Implement sort by PLANNED_DATE
- [x] **TASK-025:** Test Airtable read with real data

### n8n Integration (Write via Webhook)

- [x] **TASK-026:** Create n8n webhook client (lib/n8n.ts)
- [x] **TASK-027:** Implement POST to n8n webhook with work order completion data
- [x] **TASK-028:** Handle n8n webhook response (success/failure)
- [x] **TASK-029:** Test n8n webhook integration with sample data

### File Storage (Day 1: Supabase, Day 2: S3)

- [x] **TASK-030:** Create storage utility module (lib/storage.ts)
- [x] **TASK-031:** Implement Supabase Storage upload (Day 1 - temporary)
- [x] **TASK-032:** Create storage bucket in Supabase (work-order-photos)
- [x] **TASK-033:** Configure storage policies (private bucket, RLS by work order ownership)
- [ ] **TASK-034:** Test Supabase Storage upload flow
- [ ] **TASK-035:** (Day 2) Switch lib/storage.ts to use S3 with presigned URLs
- [ ] **TASK-036:** (Day 2) Create API route for S3 presigned URLs
- [ ] **TASK-037:** (Day 2) Test S3 upload flow

### Dashboard

- [x] **TASK-038:** Create dashboard page (app/dashboard/page.tsx)
- [x] **TASK-039:** Create work order list API route (GET /api/work-orders)
- [x] **TASK-040:** Implement work order fetching from Airtable (DeBloq base)
- [x] **TASK-041:** Create WorkOrderCard component
- [x] **TASK-042:** Create WorkOrderList component with grouping (Today/Upcoming/Overdue)
- [x] **TASK-043:** Add refresh functionality
- [x] **TASK-044:** Add loading and error states
- [x] **TASK-045:** Test dashboard with real Airtable data

### Work Order Initialization

- [x] **TASK-046:** Create work order page (app/work-order/[id]/page.tsx)
- [x] **TASK-047:** Create init API route (POST /api/work-orders/init)
- [x] **TASK-048:** Implement work order creation/retrieval in Supabase
- [x] **TASK-049:** Parse URL parameters (WO_ID, WO_TYPE, etc.)
- [x] **TASK-050:** Fetch work order from Airtable (DeBloq) if needed
- [x] **TASK-051:** Add authorization check (WO belongs to logged-in user)
- [ ] **TASK-052:** Test work order initialization flow

### File Upload Component

- [ ] **TASK-053:** Create FileUpload component (components/FileUpload.tsx)
- [ ] **TASK-054:** Implement multi-file selection
- [ ] **TASK-055:** Implement upload via storage utility (Supabase day 1, S3 day 2)
- [ ] **TASK-056:** Add preview thumbnails
- [ ] **TASK-057:** Add progress indicators
- [ ] **TASK-058:** Add remove file functionality
- [ ] **TASK-059:** Add file validation (type, size limits)
- [ ] **TASK-060:** Test on mobile devices

### Battery Swap Form (Standalone - No Multi-Form for MVP)

- [ ] **TASK-061:** Create BatterySwapForm component (components/forms/BatterySwapForm.tsx)
- [ ] **TASK-062:** Implement battery position selector (dropdown: 1, 2, 3 or bat1, bat2, bat3)
- [ ] **TASK-063:** Implement QR scanner for serial numbers (lib/qr-scanner.ts)
- [ ] **TASK-064:** Add multiple battery swap entries (add/remove)
- [ ] **TASK-065:** Implement old/new battery SN inputs with QR buttons
- [ ] **TASK-066:** Add optional notes field
- [ ] **TASK-067:** Add optional photos upload
- [ ] **TASK-068:** Create API route (POST /api/work-orders/[id]/battery-swaps)
- [ ] **TASK-069:** Implement save to Supabase (multiple rows, one per battery)
- [ ] **TASK-070:** Validate no duplicate battery positions
- [ ] **TASK-071:** Auto-complete work order after battery swap submission (standalone only)
- [ ] **TASK-072:** Test battery swap form end-to-end

### Maintenance Form

- [ ] **TASK-073:** Create MaintenanceForm component (components/forms/MaintenanceForm.tsx)
- [ ] **TASK-074:** Add reporting category dropdown (from formConfig)
- [ ] **TASK-075:** Implement Issue Identification section
- [ ] **TASK-076:** Implement Initial Assessment section (before photos)
- [ ] **TASK-077:** Implement Work Performed section (work photos)
- [ ] **TASK-078:** Implement Completion section (after photos)
- [ ] **TASK-079:** Integrate FileUpload component for all photo sections
- [ ] **TASK-080:** Save form data as JSON with embedded photo URLs
- [ ] **TASK-081:** Test maintenance form with different categories

### Wind Audit Form

- [ ] **TASK-082:** Create WindAuditForm component (components/forms/WindAuditForm.tsx)
- [ ] **TASK-083:** Implement Site Check section (collapsible)
- [ ] **TASK-084:** Implement Wind Audit section
- [ ] **TASK-085:** Implement Locker Before section
- [ ] **TASK-086:** Implement Locker Test section
- [ ] **TASK-087:** Implement Ground & Plexo Test section
- [ ] **TASK-088:** Implement Completion section
- [ ] **TASK-089:** Integrate FileUpload for all photo sections
- [ ] **TASK-090:** Save form data as JSON with embedded photo URLs
- [ ] **TASK-091:** Test wind audit form end-to-end

### Survey Form (Deferred - Placeholder Only)

- [ ] **TASK-092:** Create SurveyForm placeholder component - minimal implementation

### Form Submission API

- [ ] **TASK-093:** Create form submission API route (POST /api/work-orders/[id]/form-submission)
- [ ] **TASK-094:** Implement save to Supabase (formType, formData JSONB)
- [ ] **TASK-095:** Add authorization check (WO belongs to user)
- [ ] **TASK-096:** Return submission ID with localId for parts linking
- [ ] **TASK-097:** Test form submission with all form types

### Multi-Form Flow (Maintenance + Wind Audit only)

- [ ] **TASK-098:** Implement "Add Another Intervention" UI
- [ ] **TASK-099:** Track completed forms in work order state
- [ ] **TASK-100:** Show list of completed forms
- [ ] **TASK-101:** Filter available form types based on config (maintenance repeatable, wind audit once)
- [ ] **TASK-102:** Test adding multiple maintenance forms with different categories
- [ ] **TASK-103:** Test mixing form types (maintenance + wind audit)

### Parts Tracking (Consolidated at End)

- [ ] **TASK-104:** Create PartsTrackingPage component (components/forms/PartsTrackingPage.tsx)
- [ ] **TASK-105:** Create FormPartsSection component (components/parts/FormPartsSection.tsx)
- [ ] **TASK-106:** Create PartEntry component (components/parts/PartEntry.tsx)
- [ ] **TASK-107:** Display all completed forms as sections
- [ ] **TASK-108:** Implement parts input (part name + quantity) per form
- [ ] **TASK-109:** Add/remove part entries functionality
- [ ] **TASK-110:** Filter forms based on requiresPartsTracking config
- [ ] **TASK-111:** Create parts API route (POST /api/work-orders/[id]/parts)
- [ ] **TASK-112:** Implement save to Supabase with formSubmissionId (use localId from payload)
- [ ] **TASK-113:** Add "Skip - No Parts" button
- [ ] **TASK-114:** Test parts tracking with multiple forms

### Work Order Completion

- [ ] **TASK-115:** Create complete API route (POST /api/work-orders/[id]/complete)
- [ ] **TASK-116:** Mark work order as completed in Supabase
- [ ] **TASK-117:** Prepare n8n payload with localId for form submissions
- [ ] **TASK-118:** Call n8n webhook (target: Airtable Reports base)
- [ ] **TASK-119:** Handle n8n webhook response (mark syncedToAirtable on success)
- [ ] **TASK-120:** Handle sync errors gracefully (keep syncedToAirtable=false)
- [ ] **TASK-121:** Show success/error messages to user
- [ ] **TASK-122:** Add manual retry button on failure
- [ ] **TASK-123:** Redirect to dashboard on success
- [ ] **TASK-124:** Test complete flow end-to-end with n8n

### UI Components (Minimal for MVP)

- [ ] **TASK-125:** Set up basic shadcn/ui components (Button, Card, Input)
- [ ] **TASK-126:** Create Loading spinner component
- [ ] **TASK-127:** Create Toast/notification system (simple)

### Mobile Optimization (Basic Testing)

- [ ] **TASK-128:** Test all forms on mobile viewports
- [ ] **TASK-129:** Test photo upload on mobile devices
- [ ] **TASK-130:** Test QR scanner on iOS Safari
- [ ] **TASK-131:** Test QR scanner on Android Chrome
- [ ] **TASK-132:** Ensure touch targets are adequate (no optimization, just functional)

### Error Handling & Loading States

- [ ] **TASK-133:** Add loading states to all async operations
- [ ] **TASK-134:** Add error boundaries
- [ ] **TASK-135:** Implement proper error messages for failed uploads
- [ ] **TASK-136:** Add validation feedback on forms
- [ ] **TASK-137:** Handle network errors gracefully
- [ ] **TASK-138:** Add retry logic for failed n8n calls

### Docker & Containerization

- [ ] **TASK-139:** Create Dockerfile (multi-stage, non-root user)
- [ ] **TASK-140:** Configure environment variables for container
- [ ] **TASK-141:** Test container build locally
- [ ] **TASK-142:** Test container run locally
- [ ] **TASK-143:** Create health check endpoint (GET /api/health)

### Kubernetes Deployment (Simplified - No Volumes!)

- [ ] **TASK-144:** Create k8s/deployment.yaml (can scale to 2+ replicas)
- [ ] **TASK-145:** Create k8s/service.yaml
- [ ] **TASK-146:** Create k8s/ingress.yaml (for reports.bloqit.io)
- [ ] **TASK-147:** Set up K8s secrets (Supabase, Airtable, S3, n8n)
- [ ] **TASK-148:** Configure resource limits (CPU, memory)
- [ ] **TASK-149:** Deploy to cluster
- [ ] **TASK-150:** Verify deployment is running
- [ ] **TASK-151:** Test ingress access at reports.bloqit.io

### Production Testing

- [ ] **TASK-152:** Test with real Airtable work order data (DeBloq base)
- [ ] **TASK-153:** Test battery swap flow (complete + auto-sync)
- [ ] **TASK-154:** Test maintenance form with single category
- [ ] **TASK-155:** Test maintenance form with multiple categories
- [ ] **TASK-156:** Test wind audit form (complete work order)
- [ ] **TASK-157:** Test mixed forms (maintenance + wind audit + parts)
- [ ] **TASK-158:** Test parts tracking with multiple forms
- [ ] **TASK-159:** Test photo uploads end-to-end (storage → n8n → Airtable)
- [ ] **TASK-160:** Test QR scanner on physical devices
- [ ] **TASK-161:** Verify data appears correctly in Airtable Reports base
- [ ] **TASK-162:** Test on iOS devices
- [ ] **TASK-163:** Test on Android devices

### Documentation

- [ ] **TASK-164:** Document environment variables (Supabase, Airtable x2, S3, n8n)
- [ ] **TASK-165:** Write deployment instructions
- [ ] **TASK-166:** Create troubleshooting guide
- [ ] **TASK-167:** Document how to add new form types
- [ ] **TASK-168:** Document reporting category list

### Security

- [ ] **TASK-169:** Add n8n webhook authentication (N8N_WEBHOOK_SECRET)
- [ ] **TASK-170:** Add file upload validation (size: 10MB, types: jpg/png/webp/heic)
- [ ] **TASK-171:** Add Zod input validation to all API routes
- [ ] **TASK-172:** Configure S3 CORS policy (allow only reports.bloqit.io)
- [ ] **TASK-173:** Set up K8s secrets (no plain env vars in deployment.yaml)
- [ ] **TASK-174:** Add Supabase Row Level Security (RLS) policies
- [ ] **TASK-175:** Test auth: ensure users can only access their WOs

### Bug Fixes & Polish

- [ ] **TASK-176:** Fix any bugs found in production testing
- [ ] **TASK-177:** Performance optimization if needed
- [ ] **TASK-178:** UI polish and consistency
- [ ] **TASK-179:** Final review of all flows

### Logging (Deferred to v2 - Use console.log for MVP)

_Note: Pino and Sentry deferred to v2. MVP uses console.log for debugging._

---

## Success Criteria

Must be ✓ by Monday morning (Feb 16, 2026):

- [ ] **SUCCESS-001:** Accessible via https://reports.bloqit.io
- [ ] **SUCCESS-002:** Technicians can log in with Supabase Auth (email/password)
- [ ] **SUCCESS-003:** Dashboard shows assigned work orders from DeBloq base (filtered by technician)
- [ ] **SUCCESS-004:** Can complete Battery Swap work orders (standalone, auto-complete)
- [ ] **SUCCESS-005:** Can complete Maintenance work orders (single category)
- [ ] **SUCCESS-006:** Can complete Maintenance work orders (multiple categories)
- [ ] **SUCCESS-007:** Can complete Wind Audit work orders
- [ ] **SUCCESS-008:** Can mix form types (maintenance + wind audit)
- [ ] **SUCCESS-009:** Parts tracking works for maintenance and wind audit
- [ ] **SUCCESS-010:** Photos upload successfully (Supabase Storage day 1, S3 day 2+)
- [ ] **SUCCESS-011:** QR scanner works for battery serial numbers
- [ ] **SUCCESS-012:** All data saves to Supabase (PostgreSQL)
- [ ] **SUCCESS-013:** Completed work orders sync to Airtable Reports base via n8n
- [ ] **SUCCESS-014:** Works on mobile devices (iOS and Android)
- [ ] **SUCCESS-015:** Errors handled gracefully with user-friendly messages
- [ ] **SUCCESS-016:** Security implemented (RLS policies, webhook auth, file validation, auth checks)

---

## Out of Scope (Defer to v2)

- Sync queue with automatic retry logic
- Slack notifications
- Actual PDF generation
- Offline mode / service worker
- Email notifications
- Advanced search/filters
- User management UI
- Real-time updates
- Work order reassignment

---

## Notes

**Total Tasks:** 179 (streamlined for MVP - removed logging, simplified mobile testing)
**Prerequisites:** 5 sections (Supabase, Airtable x2, n8n, S3, K8s)
**Success Criteria:** 16 items (includes security validation)

**Architecture Changed:** Switched from Clerk + SQLite to Supabase (Auth + PostgreSQL)
- ✅ Simpler deployment (no persistent volumes)
- ✅ Can scale to multiple replicas
- ✅ Better for production
- ✅ Free tier covers MVP

**Two Airtable Bases:**
- **DeBloq:** Existing base (read work orders, update status)
- **Reports:** NEW base (full form data, battery swaps, parts)

**File Storage Transition:**
- **Day 1 (Thu):** Supabase Storage (unblock development)
- **Day 2 (Fri):** Switch to S3 (~30 min change in lib/storage.ts)

**MVP Scope:**
- ✅ Battery Swap: Standalone only (no multi-form)
- ✅ Maintenance: Repeatable (multiple categories per WO)
- ✅ Wind Audit: One per WO, can mix with maintenance
- ✅ Parts: Consolidated at end (maintenance + wind audit only)
- ❌ Survey: Placeholder only (deferred)
- ❌ Advanced logging: Console.log only (pino/Sentry deferred to v2)

**Configuration-driven:** Easy to add new form types via `lib/formConfig.ts`
**Mobile-first:** Functional on phones/tablets (polish deferred to v2)
