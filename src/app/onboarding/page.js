// journeys/app/src/app/onboarding/page.js
'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { completeOnboarding } from './actions';
import styles from '@/styles/pages/onboarding/onboardingPage.module.css';

// --- Helper Data ---
const goalsList = [
  { title: 'Find Inner Peace', value: 'peace' },
  { title: 'Build Strength', value: 'strength' },
  { title: 'Increase Flexibility', value: 'flexibility' },
  { title: 'Improve Sleep', value: 'sleep' },
  { title: 'Beginner Basics', value: 'beginner' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i);
const months = [
  { name: 'January', value: 1 }, { name: 'February', value: 2 },
  { name: 'March', value: 3 }, { name: 'April', value: 4 },
  { name: 'May', value: 5 }, { name: 'June', value: 6 },
  { name: 'July', value: 7 }, { name: 'August', value: 8 },
  { name: 'September', value: 9 }, { name: 'October', value: 10 },
  { name: 'November', value: 11 }, { name: 'December', value: 12 },
];

// --- Component ---

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  
  const [name, setName] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // EFFECT: Sync name when session loads
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.name) {
      // ONLY update if the name is actually different to avoid loops/warnings
      if (name !== session.user.name) {
         setName(session.user.name);
      }
    }
    // Add 'name' to dependency array to satisfy linter, 
    // but the if-check above prevents infinite loops.
  }, [session, status, name]);

  // --- Handlers ---

  const handleGoalClick = (goalValue) => {
    setSelectedGoals((prev) => {
      if (prev.includes(goalValue)) {
        return prev.filter((g) => g !== goalValue);
      }
      return [...prev, goalValue];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      name: name,
      monthOfBirth: month,
      yearOfBirth: year,
      goals: selectedGoals,
    };

    try {
      const result = await completeOnboarding(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (error) {
      if (error.digest?.startsWith('NEXT_REDIRECT')) {
        // Expected redirect behavior
      } else {
        console.error('Onboarding Submit Error:', error);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    }
  };

  // --- Render ---

  if (status === "loading") {
     // Optional: A better loading UI matches your app's design
     return <main className={styles.container}><p>Loading...</p></main>;
  }

  return (
    <main className={styles.container}>
      <h1>👋 Welcome, {name || session?.user?.name || 'Yogi'}!</h1>
      <p>Tell us a bit about your journey to get started.</p>
      
      {error && <p className={styles.error}>Error: {error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.fieldGroup}>
          <label htmlFor="name" className={styles.label}>Name (Confirm)</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className={styles.textInput}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Date of Birth</label>
          <div className={styles.birthDateGroup}>
            <div>
              <label htmlFor="month" className="sr-only">Month</label>
              <select 
                id="month" 
                name="month" 
                value={month} 
                onChange={(e) => setMonth(e.target.value)} 
                required
                className={styles.select}
              >
                <option value="" disabled>Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="sr-only">Year</label>
              <select 
                id="year" 
                name="year" 
                value={year} 
                onChange={(e) => setYear(e.target.value)} 
                required
                className={styles.select}
              >
                <option value="" disabled>Year</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>What are your goals?</label>
          <div className={styles.goalList}>
            {goalsList.map((goal) => {
              const isActive = selectedGoals.includes(goal.value);
              return (
                <button
                  type="button"
                  key={goal.value}
                  onClick={() => handleGoalClick(goal.value)}
                  className={`${styles.goalButton} ${isActive ? styles.active : ''}`}
                >
                  {goal.title}
                  {isActive && <span className={styles.checkIcon}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || selectedGoals.length === 0} 
          className={styles.submitButton}
        >
          {loading ? 'Saving...' : 'Complete Onboarding'}
        </button>
      </form>

      <button 
        onClick={() => signOut()} 
        className={styles.signOutButton}
      >
        Sign Out
      </button>
    </main>
  );
}