/**
 * Admin Authorization Utilities
 *
 * Checks if a user has admin privileges
 * Admin users are defined via ADMIN_EMAILS environment variable
 */

import { User } from '@supabase/supabase-js';

/**
 * Get list of admin emails from environment
 */
function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';

  // Parse comma-separated list of emails
  return adminEmailsEnv
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Check if a user is an admin
 *
 * @param user - Supabase user object
 * @returns True if user is admin
 */
export function isAdmin(user: User | null): boolean {
  if (!user || !user.email) {
    return false;
  }

  const adminEmails = getAdminEmails();
  const userEmail = user.email.toLowerCase();

  return adminEmails.includes(userEmail);
}

/**
 * Check if a user is an admin (by email string)
 *
 * @param email - User email
 * @returns True if email is in admin list
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Get admin check result with details
 *
 * @param user - Supabase user object
 * @returns Admin check result with details
 */
export function checkAdmin(user: User | null): {
  isAdmin: boolean;
  reason?: string;
} {
  if (!user) {
    return { isAdmin: false, reason: 'Not authenticated' };
  }

  if (!user.email) {
    return { isAdmin: false, reason: 'No email associated with user' };
  }

  const adminEmails = getAdminEmails();

  if (adminEmails.length === 0) {
    return {
      isAdmin: false,
      reason: 'No admin emails configured (set ADMIN_EMAILS)',
    };
  }

  const userEmail = user.email.toLowerCase();

  if (!adminEmails.includes(userEmail)) {
    return {
      isAdmin: false,
      reason: `Email ${user.email} is not in admin list`,
    };
  }

  return { isAdmin: true };
}

/**
 * Throw error if user is not admin
 *
 * @param user - Supabase user object
 * @throws Error if not admin
 */
export function requireAdmin(user: User | null): void {
  const check = checkAdmin(user);

  if (!check.isAdmin) {
    throw new Error(check.reason || 'Admin access required');
  }
}
