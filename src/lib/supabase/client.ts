/**
 * Supabase Client for Browser/Client Components
 *
 * Use this client in:
 * - Client Components ('use client')
 * - Browser-side code
 * - Client-side authentication flows
 *
 * DO NOT use in Server Components or API routes - use server.ts instead
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
