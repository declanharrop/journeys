// journeys/app/src/app/account/page.js
'use client';
import { signOut } from 'next-auth/react';

export default function AccountPage() {
  return (
    <main style={{ padding: '20px', paddingBottom: '100px' }}>
      <h1>👤 Account</h1>
      <p>This is where users will manage their subscription and details.</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </main>
  );
}