import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import PracticeCard from '@/components/Cards/PracticeCard';
import styles from '@/styles/pages/home/homePage.module.css';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 1. FORCE DYNAMIC RENDERING
export const revalidate = 0;

// Query 1: For FREE users
const freePracticesQuery = groq`
  *[_type == "practice" && 
    (isPremium == false || !defined(isPremium)) &&
    defined(video.asset) // Check if video is uploaded
  ]
  | order(_createdAt desc) [0...10] 
  {
    _id,
    title,
    thumbnail,
    "slug": slug.current,
    "duration": video.asset->data.duration,
    "playbackId": video.asset->playbackId // 👈 YOUR CORRECT QUERY
  }
`;

// Query 2: For PREMIUM users
const premiumPracticesQuery = groq`
  *[_type == "practice" && 
    defined(video.asset) // Check if video is uploaded
  ]
  | order(_createdAt desc) [0...10] 
  {
    _id,
    title,
    thumbnail,
    "slug": slug.current,
    "duration": video.asset->data.duration,
    "playbackId": video.asset->playbackId // 👈 YOUR CORRECT QUERY
  }
`;

/**
 * --- Helper Function ---
 */
async function getUserStatus(auth0Id) {
  if (!auth0Id) {
    return 'free';
  }
  const user = await serverClient.fetch(
    groq`*[_type == "user" && auth0Id == $auth0Id][0]{ subscriptionStatus }`,
    { auth0Id },
    { cache: 'no-store' } 
  );
  return user?.subscriptionStatus || 'free';
}

/**
 * --- The Home Page Server Component ---
 */
export default async function HomePage() {
  
  const session = await getServerSession(authOptions);
  const status = await getUserStatus(session?.user?.auth0Id);
  const isPremium = status === 'premium';

  let practices;
  if (isPremium) {
    practices = await serverClient.fetch(premiumPracticesQuery);
  } else {
    practices = await serverClient.fetch(freePracticesQuery);
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Latest Practices</h1>
        <p className={styles.subtitle}>Start your flow with our newest videos.</p>
      </header>
      
      <div className={styles.feedGrid}>
        {practices.length > 0 ? (
          practices.map((practice) => (
            <PracticeCard key={practice._id} practice={practice} />
          ))
        ) : (
          <p>No new practices available.</p>
        )}
      </div>
    </main>
  );
}