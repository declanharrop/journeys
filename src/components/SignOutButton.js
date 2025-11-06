'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })} // Send user to landing page
      style={{
        width: '100%',
        fontSize: '1.6rem',
        padding: '14px 20px',
        backgroundColor: 'transparent',
        color: 'var(--color-text-muted)',
        border: '1px solid var(--color-border)',
        marginTop: '16px', // Add some space above
      }}
    >
      Sign Out
    </button>
  );
}