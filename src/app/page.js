// journeys/app/src/app/page.js (The Landing Page)

'use client';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'authenticated') {
    // If they are logged in and hit the landing page, 
    // the AuthLayout will check onboarding status and redirect them.
  }

  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Find Your Flow Yoga</h1>
      <h2>Journeys for Lasting Habits.</h2>
      <p>Learn about our 3, 7, and 21-day structured programs...</p>
      <button 
        onClick={() => signIn('auth0')} 
        style={{ padding: '10px 20px', cursor: 'pointer', marginTop: '20px' }}
      >
        Start Your Journey (Sign In)
      </button>
    </main>
  );
}