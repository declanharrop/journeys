// journeys/app/src/app/(app)/subscribe/page.js
'use client';

export default function SubscribePage() {
  return (
    <main style={{ padding: '20px', paddingBottom: '100px', textAlign: 'center' }}>
      <h1>✨ Unlock Your Full Potential</h1>
      <p style={{ maxWidth: '400px', margin: '16px auto' }}>
        To access all Journeys, personalized tracking, and our full video library, 
        please upgrade to a premium membership.
      </p>
      
      {/* This is where your Stripe "Upgrade" button will go.
        For now, it's a placeholder.
      */}
      <button 
        style={{ 
          padding: '12px 24px', 
          fontSize: '1.8rem', 
          marginTop: '20px' 
        }}
        onClick={() => alert('Stripe Checkout will go here!')}
      >
        Upgrade to Premium
      </button>
    </main>
  );
}