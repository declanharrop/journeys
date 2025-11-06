// journeys/app/src/app/(app)/layout.js

// 1. Import everything needed for server-side data fetching
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';

// 2. Import your BottomNav component using your new file path
import BottomNav from '@/components/Navigation/BottomNav';

// 3. Make the layout an async function to allow 'await'
export default async function AppLayout({ children }) {
  
  // 4. Fetch the user's session
  const session = await getServerSession(authOptions);
  
  let subscriptionStatus = 'free'; // Default to 'free'

  if (session?.user?.auth0Id) {
    // 5. Fetch the user's live subscriptionStatus from Sanity (SST)
    const auth0Id = session.user.auth0Id;
    const user = await serverClient.fetch(
      groq`*[_type == "user" && auth0Id == $auth0Id][0]{ subscriptionStatus }`,
      { auth0Id }
    );
    if (user) {
      subscriptionStatus = user.subscriptionStatus;
    }
  }

  return (
    <>
      <div style={{ paddingBottom: '80px' }}>
        {children}
      </div>
      
      {/* 6. Pass the status to BottomNav as a prop */}
      <BottomNav subscriptionStatus={subscriptionStatus} />
    </>
  );
}