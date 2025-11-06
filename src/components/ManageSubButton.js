// journeys/app/src/app/components/ManageSubButton.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageSubButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Call the new API route
      const response = await fetch('/api/manage-subscription', {
        method: 'POST',
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // 2. Redirect the user to the Stripe Portal URL
      if (data.url) {
        router.push(data.url);
      }

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%',
          fontSize: '1.6rem',
          padding: '14px 20px',
        }}
      >
        {loading ? 'Loading...' : 'Manage My Subscription'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '12px' }}>{error}</p>}
    </>
  );
}