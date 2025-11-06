'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/pages/subscribe/subscribePage.module.css'; // Use your path

// 1. Paste your Price IDs from your Stripe dashboard here
const plans = [
  {
    name: 'Monthly',
    price: '£9.99',
    duration: 'per month',
    priceId: 'price_1SQScqIlcUDYS9QKfEdD30Ym',
  },
  {
    name: 'Yearly',
    price: '£99.99',
    duration: 'per year',
    priceId: 'price_1SQSdBIlcUDYS9QKU23n5Too',
  },
  {
    name: '2 Years',
    price: '£179.99',
    duration: 'every 2 years',
    priceId: 'price_1SQSdoIlcUDYS9QKBY2iNDfB',
  },
];

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async (priceId) => {
    setLoading(true);
    setError(null);

    try {
      // 2. Call your API route
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId: priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // 3. Redirect to Stripe Checkout
      if (data.url) {
        router.push(data.url);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>✨ Unlock Your Full Potential</h1>
      <p className={styles.subtitle}>
        Choose a plan to access all Journeys, personalized tracking, and our
        full video library. All plans include a 7-day free trial.
      </p>

      <div className={styles.planGrid}>
        {plans.map((plan) => (
          <button
            key={plan.priceId}
            className={`${styles.planButton} ${loading ? styles.loading : ''}`}
            onClick={() => handleSubscribe(plan.priceId)}
            disabled={loading}
          >
            {plan.name}
            <span className={styles.planDuration}>
              {plan.price} / {plan.duration}
            </span>
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </main>
  );
}