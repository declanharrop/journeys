import { auth } from '@/lib/auth';
import { serverClient } from '@/lib/sanity.server';
import { 
  USER_JOURNEY_FILTER_DATA_QUERY,
  ACTIVE_JOURNEYS_QUERY,
  GOAL_JOURNEYS_QUERY,
  ALL_JOURNEYS_QUERY,
  GET_USER_STATUS_BY_ID_QUERY // 👈 Import this again
} from '@/lib/sanity.queries';
import JourneyRow from '@/components/JourneyRow';
import styles from '@/styles/pages/journeys/journeysPage.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JourneysPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  // 1. Fetch User Filter Data AND Status in parallel
  const [userData, userStatus] = await Promise.all([
     serverClient.fetch(USER_JOURNEY_FILTER_DATA_QUERY, { email: userEmail }),
     session?.user?.id ? serverClient.fetch(GET_USER_STATUS_BY_ID_QUERY, { id: session.user.id }) : Promise.resolve('free')
  ]);

  const isPremiumUser = ['active', 'trialing', 'premium'].includes(userStatus);
  const activeIds = userData?.activeJourneyIds || [];
  const goals = userData?.goals || [];

  // 2. Fetch Rows
  const [activeJourneys, goalJourneys, allJourneys] = await Promise.all([
    activeIds.length > 0 ? serverClient.fetch(ACTIVE_JOURNEYS_QUERY, { ids: activeIds }) : Promise.resolve([]),
    goals.length > 0 ? serverClient.fetch(GOAL_JOURNEYS_QUERY, { goals }) : Promise.resolve([]),
    serverClient.fetch(ALL_JOURNEYS_QUERY)
  ]);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Your Journeys</h1>
        <p>Curated paths to help you reach your goals, one day at a time.</p>
      </header>

      <div className={styles.rowsContainer}>
        <JourneyRow 
           title="Continue Your Journey" 
           journeys={activeJourneys}
           isPremiumUser={isPremiumUser} // 👈 Pass it down
        />
        <JourneyRow 
           title="For You" 
           journeys={goalJourneys}
           isPremiumUser={isPremiumUser} // 👈 Pass it down
        />
        <JourneyRow 
           title="Newest Journeys" 
           journeys={allJourneys}
           isPremiumUser={isPremiumUser} // 👈 Pass it down
        />
      </div>
    </main>
  );
}