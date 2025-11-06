// journeys/app/src/app/(app)/layout.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';

// Use your correct component path
import BottomNav from '@/components/Navigation/BottomNav';

// We must set the runtime to 'nodejs' to use the serverClient
export const runtime = 'nodejs';

/**
 * This Server Component fetches the user's subscription status
 * and passes it down to the client-side BottomNav component.
 */
export default async function AppLayout({ children }) {
  
  // 1. Get the user's session
  const session = await getServerSession(authOptions);
  
  let subscriptionStatus = 'free'; // Default to 'free'
  
  // 2. --- THIS IS THE CHANGE ---
  //    Get the email from the session
  const email = session?.user?.email;

  if (email) {
    // 3. Fetch the user's status from Sanity using their EMAIL
    const user = await serverClient.fetch(
      groq`*[_type == "user" && email == $email][0]{ subscriptionStatus }`,
      { email },
      { cache: 'no-store' } // Always get fresh status
    );
    if (user) {
      subscriptionStatus = user.subscriptionStatus;
    }
  }
  // 4. --- END OF CHANGE ---

  return (
    <>
      {/* This adds padding to the bottom of all app pages
          so the nav bar doesn't cover the content.
      */}
      <div style={{ paddingBottom: '80px' }}>
        {children}
      </div>
      
      {/* 5. Pass the status to BottomNav as a prop */}
      <BottomNav subscriptionStatus={subscriptionStatus} />
    </>
  );
}