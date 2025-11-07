'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// 👇 1. Import a nice checkmark icon
import { GoCheckCircleFill } from 'react-icons/go'; 
import styles from '@/styles/pages/subscribe/subscribePage.module.css';

const plans = [
  // ... (keep your existing plans identical)
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

// 👇 2. Define the benefits list for easy editing later
const benefits = [
  'Unlimited access to all Journeys',
  'Full library of 100+ premium videos',
  'Personalized progress tracking',
  'Practice anytime, on any device',
  '7-day free trial included',
  'Cancel online at any time',
];

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async (priceId) => {
     // ... (keep existing handleSubscribe logic identical)
     setLoading(true);
     setError(null);
 
     try {
       const response = await fetch('/api/checkout', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ priceId: priceId }),
       });
       const data = await response.json();
       if (!response.ok) throw new Error(data.error || 'Something went wrong');
       if (data.url) router.push(data.url);
     } catch (err) {
       setError(err.message);
       setLoading(false);
     }
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>✨ Unlock Your Full Potential</h1>
      <p className={styles.subtitle}>
        Join the community and start your personalized path to wellness today.
      </p>

      {/* 👇 3. NEW BENEFITS SECTION 👇 */}
      <div className={styles.benefitsContainer}>
        <ul className={styles.benefitsList}>
          {benefits.map((benefit, index) => (
            <li key={index} className={styles.benefitItem}>
              <GoCheckCircleFill className={styles.checkIcon} />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
      {/* 👆 END NEW SECTION 👆 */}

      <div className={styles.planGrid}>
        {plans.map((plan) => (
          <button
            key={plan.priceId}
            className={`${styles.planButton} ${loading ? styles.loading : ''}`}
            onClick={() => handleSubscribe(plan.priceId)}
            disabled={loading}
          >
            <span className={styles.planName}>{plan.name}</span>
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