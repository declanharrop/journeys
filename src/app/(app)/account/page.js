// src/app/(app)/account/page.js
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { serverClient } from '@/lib/sanity.server';
import { GET_ACCOUNT_DETAILS_QUERY } from '@/lib/sanity.queries';
import ManageSubButton from '@/components/ManageSubButton';
import styles from '@/styles/pages/account/accountPage.module.css';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getFriendlyStatus(status, cancelAtPeriodEnd) {
  // Ensure we check for both 'active' AND 'trialing' when canceling
  if (cancelAtPeriodEnd && (status === 'active' || status === 'trialing')) {
    return { text: 'Canceling', className: styles.statusWarning };
  }

  const statusMap = {
    'active': { text: 'Active', className: styles.statusActive },
    'trialing': { text: 'Active (Trial)', className: styles.statusActive },
    'past_due': { text: 'Past Due', className: styles.statusWarning },
    'canceled': { text: 'Canceled', className: styles.statusCanceled },
  };
  return statusMap[status] || { text: 'Inactive', className: styles.statusCanceled };
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

export default async function AccountPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect('/');
  }

  const sanityUser = await serverClient.fetch(
    GET_ACCOUNT_DETAILS_QUERY,
    { email },
    { cache: 'no-store' }
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

  const { subscriptionStatus, cancelAtPeriodEnd, currentPeriodEnd, name, stripeCustomerId } = sanityUser;
  
  const statusInfo = getFriendlyStatus(subscriptionStatus, cancelAtPeriodEnd);
  const dateInfo = formatDate(currentPeriodEnd);
  
  const isActiveOrTrialing = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  // Logic for showing renewal vs end date
  const showRenews = isActiveOrTrialing && !cancelAtPeriodEnd;
  const showEnds = subscriptionStatus === 'canceled' || (isActiveOrTrialing && cancelAtPeriodEnd);

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Account</h1>

        <div className={styles.infoGrid}>
          <strong className={styles.label}>Name</strong>
          <span className={styles.value}>{name || session.user.name}</span>

          <strong className={styles.label}>Email</strong>
          <span className={styles.value}>{sanityUser.email}</span>

          <strong className={styles.label}>Subscription</strong>
          <span className={`${styles.value} ${statusInfo.className}`}>
            {statusInfo.text}
          </span>

          {showRenews && dateInfo && (
            <>
              <strong className={styles.label}>Renews On</strong>
              <span className={styles.value}>{dateInfo}</span>
            </>
          )}
          
          {showEnds && dateInfo && (
             <>
              <strong className={styles.label}>Access Ends On</strong>
              <span className={styles.value}>{dateInfo}</span>
            </>
          )}
        </div>

        <div className={styles.buttonContainer}>
          {stripeCustomerId ? (
            <ManageSubButton />
          ) : (
             <p className={styles.noSubText}>No active subscription.</p>
          )}
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}