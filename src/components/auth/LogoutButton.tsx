'use client';

/**
 * Logout Button Component
 *
 * Client component that calls the server action to sign out
 */

import { signOut } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleLogout} variant="outline" disabled={loading}>
      {loading ? 'Signing out...' : 'Sign Out'}
    </Button>
  );
}
