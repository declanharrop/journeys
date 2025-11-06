import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import VideoPlayer from '@/components/VideoPlayer';
import styles from '@/styles/pages/practice/practicePage.module.css';
import { notFound, redirect } from 'next/navigation'; // 1. Import 'redirect'
import { getServerSession } from 'next-auth'; // 2. Import auth tools
import { authOptions } from '@/lib/authOptions';
import { urlFor } from '@/lib/sanity.client';

export const dynamic = 'force-dynamic';

// This query is correct.
const practiceQuery = groq`
  *[_type == "practice" && slug.current == $slug][0] {
    _id,
    title,
    description,
    thumbnail,
    "playbackId": video.asset->playbackId,
    isPremium // 3. We need this field for our check
  }
`;

// 4. We need our helper function to get the user's status
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

export default async function PracticePage({ params }) {
  
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  // 5. Fetch both the practice and the user's session at the same time
  const [practice, session] = await Promise.all([
    serverClient.fetch(practiceQuery, { slug }),
    getServerSession(authOptions)
  ]);

  // 6. If no practice, 404
  if (!practice || !practice.playbackId) {
    notFound();
    return null; 
  }

  // 7. 👇 --- THE NEW SECURITY CHECK --- 👇
  if (practice.isPremium) {
    // This is a premium video. Check the user's status.
    const status = await getUserStatus(session?.user?.auth0Id);
    if (status !== 'premium') {
      // If not premium, redirect them to the subscribe page
      redirect('/subscribe');
    }
  }
  // If the practice is not premium, we let everyone through.
  // 👆 --- END OF CHECK --- 👆

  const thumbnailUrl = practice.thumbnail 
    ? urlFor(practice.thumbnail).width(1920).quality(80).auto('format').url()
    : null;

  return (
    <main className={styles.container}>
      {/* 8. If the check passes, render the player */}
      <VideoPlayer playbackId={practice.playbackId} thumbnailUrl={thumbnailUrl}/>
      
      <div className={styles.content}>
        <h1 className={styles.title}>{practice.title}</h1>
        {practice.description && (
          <p className={styles.description}>{practice.description}</p>
        )}
      </div>
    </main>
  );
}