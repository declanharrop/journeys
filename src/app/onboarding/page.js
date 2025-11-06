// journeys/app/src/app/onboarding/page.js
'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { completeOnboarding } from './actions';
import styles from '@/styles/pages/onboarding/onboardingPage.module.css'; // 👈 Import CSS Module

// --- Helper Data ---

// List of goals to render
const goalsList = [
  { title: 'Find Inner Peace', value: 'peace' },
  { title: 'Build Strength', value: 'strength' },
  { title: 'Increase Flexibility', value: 'flexibility' },
  { title: 'Improve Sleep', value: 'sleep' },
  { title: 'Beginner Basics', value: 'beginner' },
];

// Populate month and year options
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i); // For users 18+
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
  const { data: session } = useSession();
  
  const [name, setName] = useState(session?.user?.name || '');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [selectedGoals, setSelectedGoals] = useState([]); // 👈 State for multi-select
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Handlers ---

  const handleGoalClick = (goalValue) => {
    setSelectedGoals((prev) => {
      // If goal is already selected, remove it
      if (prev.includes(goalValue)) {
        return prev.filter((g) => g !== goalValue);
      }
      // Otherwise, add it
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
      // 1. Call the server action
      const result = await completeOnboarding(formData);

      // 2. If the action returns a custom error object, display it
      if (result?.error) {
        setError(result.error);
        setLoading(false); // Stop loading
      }
      
      // 3. If the action succeeds, it will throw a redirect error
      // which is caught by the 'catch' block below.

    } catch (error) {
      // 4. (THE FIX) Catch the redirect error
      // This is the expected behavior for a successful redirect.
      if (error.digest?.startsWith('NEXT_REDIRECT')) {
        // Do nothing. The browser is handling the redirect.
      } else {
        // This is an unexpected, non-redirect error
        console.error('Onboarding Submit Error:', error);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    }
  };

  // --- Render ---

  return (
    <main className={styles.container}>
      <h1>👋 Welcome, {session?.user?.name || 'Yogi'}!</h1>
      <p>Tell us a bit about your journey to get started.</p>
      
      {error && <p className={styles.error}>Error: {error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        
        {/* --- Name --- */}
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

        {/* --- Birth Date --- */}
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

        {/* --- Goals --- */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>What are your goals?</label>
          <div className={styles.goalList}>
            {goalsList.map((goal) => {
              const isActive = selectedGoals.includes(goal.value);
              return (
                <button
                  type="button" // Important: prevents form submission
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