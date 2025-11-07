import { auth } from '@/lib/auth'; // 👈 New v5 auth helper
import { serverClient } from '@/lib/sanity.server';
import { 
  FREE_PRACTICES_QUERY, 
  PREMIUM_PRACTICES_QUERY, 
  GET_USER_STATUS_BY_ID_QUERY 
} from '@/lib/sanity.queries'; // 👈 Imported queries
import PracticeCard from '@/components/Cards/PracticeCard';
import styles from '@/styles/pages/home/homePage.module.css';

// 1. FORCE DYNAMIC RENDERING (Essential for real-time auth/content)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  // 2. Get session using new helper
  const session = await auth();
  
  let isPremium = false;

  // 3. Check status if user is logged in.
  // We prefer fetching fresh from Sanity to handle instant upgrades after checkout.
  if (session?.user?.id) {
    const status = await serverClient.fetch(GET_USER_STATUS_BY_ID_QUERY, { 
      id: session.user.id 
    });
    isPremium = status === 'premium';
  }

  // 4. Select and execute the correct query
  const query = isPremium ? PREMIUM_PRACTICES_QUERY : FREE_PRACTICES_QUERY;
  const practices = await serverClient.fetch(query);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {isPremium ? 'Premium Practices' : 'Latest Practices'}
        </h1>
        <p className={styles.subtitle}>
          {session?.user?.name ? `Welcome back, ${session.user.name}. ` : ''}
          Start your flow with our newest videos.
        </p>
      </header>
      
      <div className={styles.feedGrid}>
        {practices.length > 0 ? (
          practices.map((practice) => (
            <PracticeCard key={practice._id} practice={practice} />
          ))
        ) : (
          <p className={styles.emptyState}>No practices available right now.</p>
        )}
      </div>
    </main>
  );
}