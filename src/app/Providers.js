// journeys/app/src/app/Providers.js

'use client'; // This is a client component

import { SessionProvider } from 'next-auth/react';

export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}