// journeys/app/src/app/(app)/layout.js

import { serverClient, sanityWriteClient } from '@/lib/sanity.server'; 
import { groq } from 'next-sanity';
import BottomNav from '@/components/Navigation/BottomNav';
import AuthGuard from '@/components/AuthGuard'; // 👈 Import the new guard
import { auth } from '@/lib/auth'; // New auth helper

// We must set the runtime to 'nodejs' to use the serverClient for fetching status
export const runtime = 'nodejs'; 

export default async function AppLayout({ children }) {
  
  // Fetch subscription status for BottomNav (logic remains here)
  const session = await auth();
  let subscriptionStatus = 'free'; 
  const email = session?.user?.email;

  if (email) {
    // Use sanityWriteClient fetch for current status (avoids caching problems)
    const user = await sanityWriteClient.fetch(
      groq`*[_type == "user" && email == $email][0]{ subscriptionStatus }`,
      { email }
    );
    if (user) {
      subscriptionStatus = user.subscriptionStatus;
    }
  }

  return (
    // 1. Wrap the children (the protected page content) with the AuthGuard
    <AuthGuard>
      {/* 2. Page content gets its padding here */}
      <div style={{ paddingBottom: '80px' }}>
        {children}
      </div>
      
      {/* 3. BottomNav (always rendered) */}
      <BottomNav subscriptionStatus={subscriptionStatus} />
    </AuthGuard>
  );
}