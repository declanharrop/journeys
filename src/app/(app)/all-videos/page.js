// journeys/app/src/app/(app)/all-videos/page.js

import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import PracticeCard from '@/components/Cards/PracticeCard';
import styles from '@/styles/pages/all-videos/allVideosPage.module.css';

// This query is now simple:
// Get ALL practices that are ready to be played.
const allPracticesQuery = groq`
  *[_type == "practice" && defined(video.asset->playbackIds] 
  | order(_createdAt desc) 
  {
    _id,
    title,
    "slug": slug.current,
    "duration": video.asset->data.duration,
    "playbackId": video.asset->playbackIds[0].id
  }
`;

async function getAllPractices() {
  // We no longer need to pass 'isPremiumUser'
  const practices = await serverClient.fetch(allPracticesQuery);
  return practices;
}

export default async function AllVideosPage() {
  // All session and user status logic is gone.
  const practices = await getAllPractices();

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>All Practices</h1>
        <p className={styles.subtitle}>Find your flow from our complete library.</p>
      </header>
      
      <div className={styles.feedGrid}>
        {practices.length > 0 ? (
          practices.map((practice) => (
            <PracticeCard key={practice._id} practice={practice} />
          ))
        ) : (
          <p>No practices have been added yet.</p>
        )}
      </div>
    </main>
  );
}