/**
 * Server Actions for Authentication
 *
 * These are server-side functions that can be called from client components.
 * They handle authentication operations securely.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Sign out the current user
 * Clears the session and redirects to login
 */
export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out');
  }

  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Get the current user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
