/**
 * Root Page
 *
 * Redirects to dashboard if authenticated, otherwise to login
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect based on auth status
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
