/**
 * Auth Callback Route Handler
 *
 * This route handles the OAuth callback from Supabase after authentication.
 * It exchanges the auth code for a session and redirects to the appropriate page.
 *
 * Flow:
 * 1. User clicks "login" → Supabase auth
 * 2. Supabase redirects here with auth code
 * 3. We exchange code for session
 * 4. Redirect user to dashboard (or original destination)
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the dashboard or the page they were trying to access
  return NextResponse.redirect(new URL(next, request.url));
}
