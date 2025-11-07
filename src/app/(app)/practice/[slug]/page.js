import { auth } from '@/lib/auth'; // New v5 auth helper
import { serverClient } from '@/lib/sanity.server';
import { urlFor } from '@/lib/sanity.client';
import { notFound, redirect } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import styles from '@/styles/pages/practice/practicePage.module.css';
import { 
  GET_PRACTICE_BY_SLUG_QUERY, 
  GET_USER_STATUS_BY_ID_QUERY 
} from '@/lib/sanity.queries'; // Centralized queries

export const dynamic = 'force-dynamic';

export default async function PracticePage({ params }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  // 1. Fetch practice data first to see if it even exists & if it's premium
  const practice = await serverClient.fetch(GET_PRACTICE_BY_SLUG_QUERY, { slug });

  if (!practice || !practice.playbackId) {
    notFound();
  }

  // 2. Security Check for Premium Content
  if (practice.isPremium) {
    const session = await auth(); // Only fetch session if needed
    let isPremiumUser = false;

    if (session?.user?.id) {
       // Fetch fresh status from Sanity using their ID
       const status = await serverClient.fetch(GET_USER_STATUS_BY_ID_QUERY, { 
         id: session.user.id 
       });
       isPremiumUser = status === 'premium';
    }

    // Redirect if not allowed
    if (!isPremiumUser) {
      redirect('/subscribe'); 
    }
  }

  // 3. Prepare thumbnail URL
  const thumbnailUrl = practice.thumbnail 
    ? urlFor(practice.thumbnail).width(1280).quality(80).auto('format').url()
    : null;

  return (
    <main className={styles.container}>
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