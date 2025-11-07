// journeys/app/src/app/(app)/account/page.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Use your correct, verified import paths
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import ManageSubButton from '@/components/ManageSubButton'; 
import styles from '@/styles/pages/account/accountPage.module.css'; 
import SignOutButton from '@/components/SignOutButton';

// We must set the runtime to 'nodejs' to use the serverClient
export const runtime = 'nodejs';

// The query to get all user details by their email
const GET_USER_QUERY = groq`*[_type == "user" && email == $email][0]{
  _id,
  name,
  email,
  subscriptionStatus,
  currentPeriodEnd,
  stripeCustomerId
}`;

// --- Helper Functions (from your code) ---

/**
 * Formats the Stripe subscription status into a user-friendly string and CSS class.
 */
function getFriendlyStatus(status) {
  const statusMap = {
    'active': { text: 'Active', className: styles.statusActive },
    'trialing': { text: 'Active (in Trial)', className: styles.statusActive },
    'past_due': { text: 'Past Due', className:styles.statusWarning },
    'canceled': { text: 'Canceled', className: styles.statusCanceled },
  };
  // Covers 'inactive', 'unpaid', null, undefined
  return statusMap[status] || { text: 'Inactive', className: styles.statusCanceled };
}

/**
 * Formats an ISO 8601 date string into a readable format (e.g., "November 6, 2025").
 */
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { // Use default locale
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return 'Invalid Date';
  }
}

// --- The Account Page Component ---
export default async function AccountPage() {
  
  // 1. Get the user's session
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  // 2. Protect the page (middleware also does this, but it's good practice)
  if (!email) {
    redirect('/'); // Go to landing page
  }

  // 3. Fetch the latest user data from Sanity using their email
  const sanityUser = await serverClient.fetch(
    GET_USER_QUERY,
    { email: email },
    // Always get fresh subscription data, never cache this page
    { cache: 'no-store' } 
  );

  // 4. Handle case where user isn't in Sanity (should be impossible, but safe)
  if (!sanityUser) {
    return (
      <main className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Error</h1>
          <p>Could not load your account details. Please contact support.</p>
        </div>
      </main>
    );
  }

  // 5. Prepare data for display
  const statusInfo = getFriendlyStatus(sanityUser.subscriptionStatus);
  const dateInfo = formatDate(sanityUser.currentPeriodEnd);
  
  // 'trialing' and 'active' are both considered "subscribed"
  const isSubscribed = ['active', 'trialing'].includes(sanityUser.subscriptionStatus);
  const isCanceled = sanityUser.subscriptionStatus === 'canceled';

  // 6. Render the page
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Account</h1>

        <div className={styles.infoGrid}>
          {/* We prefer Sanity's name data since it's from onboarding */}
          <strong className={styles.label}>Name</strong>
          <span className={styles.value}>{sanityUser.name || session.user.name}</span>

          <strong className={styles.label}>Email</strong>
          <span className={styles.value}>{sanityUser.email}</span>

          <strong className={styles.label}>Subscription</strong>
          <span className={`${styles.value} ${statusInfo.className}`}>
            Premium ({statusInfo.text})
          </span>

          {/* Show renewal date or access end date */}
          {isSubscribed && (
            <>
              <strong className={styles.label}>Renews On</strong>
              <span className={styles.value}>{dateInfo}</span>
            </>
          )}
          {isCanceled && sanityUser.currentPeriodEnd && (
             <>
              <strong className={styles.label}>Access Ends On</strong>
              <span className={styles.value}>{dateInfo}</span>
            </>
          )}
        </div>

        <div className={styles.buttonContainer}>
          {/* Only show the manage button if they have a Stripe ID */}
          {sanityUser.stripeCustomerId ? (
            <ManageSubButton />
          ) : (
             <p>You do not have a subscription to manage.</p>
          )}
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}