/**
 * Supabase TypeScript Types
 *
 * These types will be auto-generated from your database schema in the future.
 * For now, we define basic types manually.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      work_orders: {
        Row: {
          id: number;
          work_order_id: string;
          technician_user_id: string;
          status: 'in_progress' | 'completed';
          work_type: 'battery_swap' | 'maintenance' | 'wind_audit' | 'survey';
          initial_issue: string | null;
          point_code: string | null;
          locker_version: string | null;
          client: string | null;
          created_at: string;
          completed_at: string | null;
          synced_to_airtable: boolean;
        };
        Insert: {
          id?: number;
          work_order_id: string;
          technician_user_id: string;
          status: 'in_progress' | 'completed';
          work_type: 'battery_swap' | 'maintenance' | 'wind_audit' | 'survey';
          initial_issue?: string | null;
          point_code?: string | null;
          locker_version?: string | null;
          client?: string | null;
          created_at?: string;
          completed_at?: string | null;
          synced_to_airtable?: boolean;
        };
        Update: {
          id?: number;
          work_order_id?: string;
          technician_user_id?: string;
          status?: 'in_progress' | 'completed';
          work_type?: 'battery_swap' | 'maintenance' | 'wind_audit' | 'survey';
          initial_issue?: string | null;
          point_code?: string | null;
          locker_version?: string | null;
          client?: string | null;
          created_at?: string;
          completed_at?: string | null;
          synced_to_airtable?: boolean;
        };
      };
      form_submissions: {
        Row: {
          id: number;
          work_order_id: number;
          form_type: 'maintenance' | 'wind_audit' | 'survey';
          form_data: Json;
          submitted_at: string;
        };
        Insert: {
          id?: number;
          work_order_id: number;
          form_type: 'maintenance' | 'wind_audit' | 'survey';
          form_data: Json;
          submitted_at?: string;
        };
        Update: {
          id?: number;
          work_order_id?: number;
          form_type?: 'maintenance' | 'wind_audit' | 'survey';
          form_data?: Json;
          submitted_at?: string;
        };
      };
      battery_swaps: {
        Row: {
          id: number;
          work_order_id: number;
          battery_position: string;
          old_battery_sn: string;
          new_battery_sn: string;
          recorded_at: string;
        };
        Insert: {
          id?: number;
          work_order_id: number;
          battery_position: string;
          old_battery_sn: string;
          new_battery_sn: string;
          recorded_at?: string;
        };
        Update: {
          id?: number;
          work_order_id?: number;
          battery_position?: string;
          old_battery_sn?: string;
          new_battery_sn?: string;
          recorded_at?: string;
        };
      };
      parts_used: {
        Row: {
          id: number;
          work_order_id: number;
          form_submission_id: number | null;
          part_name: string;
          quantity: number;
          recorded_at: string;
        };
        Insert: {
          id?: number;
          work_order_id: number;
          form_submission_id?: number | null;
          part_name: string;
          quantity: number;
          recorded_at?: string;
        };
        Update: {
          id?: number;
          work_order_id?: number;
          form_submission_id?: number | null;
          part_name?: string;
          quantity?: number;
          recorded_at?: string;
        };
      };
    };
  };
}
