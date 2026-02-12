/**
 * Supabase Server Client for Server Components and API Routes
 *
 * Use this client in:
 * - Server Components
 * - Server Actions
 * - Route Handlers (API routes)
 *
 * This client properly handles cookies for authentication
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client for use in Route Handlers (API routes)
 * This version includes proper cookie handling for authentication
 */
export async function createRouteHandlerClient() {
  return createClient();
}

/**
 * Create a Supabase admin client with service role key
 * USE WITH CAUTION - bypasses Row Level Security
 *
 * Only use when you need to:
 * - Perform admin operations
 * - Bypass RLS for system operations
 * - Access data across all users
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // Admin client doesn't need to set cookies
        },
      },
    }
  );
}
