// src/app/(app)/account/page.js
import { auth } from '@/lib/auth'; // New v5 auth helper
import { redirect } from 'next/navigation';
import { serverClient } from '@/lib/sanity.server';
import { GET_ACCOUNT_DETAILS_QUERY } from '@/lib/sanity.queries';
import ManageSubButton from '@/components/ManageSubButton'; 
import styles from '@/styles/pages/account/accountPage.module.css'; 
import SignOutButton from '@/components/SignOutButton';

// Ensure fresh data every time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- Helper Functions ---
function getFriendlyStatus(status) {
  const statusMap = {
    'active': { text: 'Active', className: styles.statusActive },
    'trialing': { text: 'Active (in Trial)', className: styles.statusActive },
    'past_due': { text: 'Past Due', className: styles.statusWarning },
    'canceled': { text: 'Canceled', className: styles.statusCanceled },
    // Add 'premium' here if you use it as a generic status in your app
    'premium': { text: 'Active', className: styles.statusActive }, 
  };
  return statusMap[status] || { text: 'Free / Inactive', className: styles.statusCanceled };
}

function formatDate(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

// --- Page Component ---
export default async function AccountPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect('/'); 
  }

  const sanityUser = await serverClient.fetch(
    GET_ACCOUNT_DETAILS_QUERY,
    { email },
    { cache: 'no-store' } // Crucial for account data
  );

  if (!sanityUser) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Error</h1>
          <p>Could not load your account details. Please contact support.</p>
          <SignOutButton />
        </div>
      </main>
    );
  }

  const statusInfo = getFriendlyStatus(sanityUser.subscriptionStatus);
  const dateInfo = formatDate(sanityUser.currentPeriodEnd);
  
  // Check multiple 'active' statuses including generic 'premium'
  const isSubscribed = ['active', 'trialing', 'premium'].includes(sanityUser.subscriptionStatus);
  const isCanceled = sanityUser.subscriptionStatus === 'canceled';

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Account</h1>

        <div className={styles.infoGrid}>
          <strong className={styles.label}>Name</strong>
          <span className={styles.value}>{sanityUser.name || session.user.name}</span>

          <strong className={styles.label}>Email</strong>
          <span className={styles.value}>{sanityUser.email}</span>

          <strong className={styles.label}>Subscription</strong>
          <span className={`${styles.value} ${statusInfo.className}`}>
            {statusInfo.text}
          </span>

          {isSubscribed && dateInfo && (
            <>
              <strong className={styles.label}>Renews On</strong>
              <span className={styles.value}>{dateInfo}</span>
            </>
          )}
          
          {isCanceled && dateInfo && (
             <>
              <strong className={styles.label}>Access Ends On</strong>
              <span className={styles.value}>{dateInfo}</span>
            </>
          )}
        </div>

        <div className={styles.buttonContainer}>
          {sanityUser.stripeCustomerId ? (
            <ManageSubButton />
          ) : (
             // Optional: Add a "Subscribe Now" button here for free users
             <p className={styles.noSubText}>You do not have an active subscription.</p>
          )}
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}