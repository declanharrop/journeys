// journeys/app/src/app/journeys/page.js
'use client';
import { signOut } from 'next-auth/react';

export default function JourneysPage() {
  return (
    <main style={{ padding: '20px', paddingBottom: '100px' }}>
      <h1>🗺️ Journeys</h1>
      <p>This page will show all the available journeys.</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </main>
  );
}