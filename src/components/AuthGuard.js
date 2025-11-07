// journeys/app/src/app/components/AuthGuard.js
// This component MUST be a Server Component (no 'use client')

import { auth } from '@/lib/auth'; // The NextAuth helper
import { redirect } from 'next/navigation';
import { sanityFetch } from '@/lib/sanity.client'; // For fetching read-only data
import { groq } from 'next-sanity';

// Query to get user's onboarding status
const GET_ONBOARDING_STATUS = groq`
  *[_type == "user" && email == $email][0]{
    onboardingComplete
  }
`;

/**
 * AuthGuard checks session status and onboarding status.
 * It replaces the logic previously in middleware.js.
 */
export default async function AuthGuard({ children }) {
  
  // 1. Get the session using the modern 'auth' helper
  const session = await auth();
  const email = session?.user?.email;

  // --- REDIRECT CHECK 1: NOT AUTHENTICATED ---
  if (!email) {
    // If user is not logged in, send them to the public landing page.
    // NOTE: This will protect every page this component wraps.
    return redirect('/');
  }

  // 2. Fetch the user's *current* onboarding status from Sanity
  const user = await sanityFetch(GET_ONBOARDING_STATUS, { email });

  if (!user) {
    // This should not happen if signIn callback works, but good safety check.
    return redirect('/');
  }

  // --- REDIRECT CHECK 2: ONBOARDING NOT COMPLETE ---
  if (!user.onboardingComplete) {
    // If onboarding is incomplete, send them to the onboarding page.
    // NOTE: The onboarding page itself must NOT be wrapped by this component.
    return redirect('/onboarding');
  }

  // 3. If authenticated AND onboarded, render the children.
  return <>{children}</>;
}