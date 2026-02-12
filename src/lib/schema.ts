/**
 * Database Schema (Drizzle ORM - PostgreSQL)
 *
 * This file defines all database tables using Drizzle ORM for Supabase PostgreSQL.
 *
 * Tables:
 * - work_orders: Main work order records
 * - form_submissions: Maintenance, wind audit, survey forms (JSON data)
 * - battery_swaps: Battery replacement records (structured data)
 * - parts_used: Parts tracking linked to form submissions
 */

import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';

/**
 * Work Orders Table
 *
 * Main table for work order records.
 * Created when technician starts working on a WO from Airtable.
 */
export const workOrders = pgTable('work_orders', {
  id: serial('id').primaryKey(),
  workOrderId: text('work_order_id').notNull().unique(),
  technicianUserId: text('technician_user_id').notNull(), // Supabase auth.users.id
  status: text('status', {
    enum: ['in_progress', 'completed'],
  }).notNull(),
  workType: text('work_type', {
    enum: ['battery_swap', 'maintenance', 'wind_audit', 'survey'],
  }).notNull(),
  initialIssue: text('initial_issue'),
  pointCode: text('point_code'),
  lockerVersion: text('locker_version'),
  client: text('client'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  syncedToAirtable: boolean('synced_to_airtable').notNull().default(false),
});

/**
 * Form Submissions Table
 *
 * Stores form data for maintenance, wind_audit, and survey forms.
 * Battery swaps use separate table (battery_swaps).
 * Form data stored as JSONB with embedded photo URLs.
 */
export const formSubmissions = pgTable('form_submissions', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  formType: text('form_type', {
    enum: ['maintenance', 'wind_audit', 'survey'],
  }).notNull(),
  formData: jsonb('form_data').notNull(), // JSON with embedded photo URLs
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
});

/**
 * Battery Swaps Table
 *
 * Structured data for battery replacements.
 * Separate from form_submissions because it's structured data, not freeform JSON.
 */
export const batterySwaps = pgTable('battery_swaps', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  batteryPosition: text('battery_position').notNull(), // "1", "2", "3" or "bat1", "bat2", "bat3"
  oldBatterySn: text('old_battery_sn').notNull(),
  newBatterySn: text('new_battery_sn').notNull(),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
});

/**
 * Parts Used Table
 *
 * Tracks parts used during work orders.
 * Linked to specific form submissions for granular tracking.
 */
export const partsUsed = pgTable('parts_used', {
  id: serial('id').primaryKey(),
  workOrderId: integer('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  formSubmissionId: integer('form_submission_id').references(
    () => formSubmissions.id
  ), // Links parts to specific form/job
  partName: text('part_name').notNull(),
  quantity: integer('quantity').notNull(),
  recordedAt: timestamp('recorded_at').notNull().defaultNow(),
});

/**
 * TypeScript Types
 *
 * Inferred from schema for type safety
 */
export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;

export type BatterySwap = typeof batterySwaps.$inferSelect;
export type NewBatterySwap = typeof batterySwaps.$inferInsert;

export type PartUsed = typeof partsUsed.$inferSelect;
export type NewPartUsed = typeof partsUsed.$inferInsert;
