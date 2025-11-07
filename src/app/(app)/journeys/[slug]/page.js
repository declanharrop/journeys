import { auth } from '@/lib/auth';
import { serverClient } from '@/lib/sanity.server';
import { GET_JOURNEY_BY_SLUG_QUERY, GET_USER_STATUS_BY_ID_QUERY } from '@/lib/sanity.queries';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/lib/sanity.client';
import { GoPlay, GoLock } from 'react-icons/go';
import styles from '@/styles/pages/journeys/journeySlugPage.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function JourneyPage({ params }) {
  const { slug } = await params;
  const session = await auth();

  // 1. Fetch Journey Data
  const journey = await serverClient.fetch(GET_JOURNEY_BY_SLUG_QUERY, { slug });

  if (!journey) {
    notFound();
  }

  // 2. Security Check
  let isPremiumUser = false;
  if (session?.user?.id) {
    const status = await serverClient.fetch(GET_USER_STATUS_BY_ID_QUERY, { id: session.user.id });
    isPremiumUser = ['active', 'trialing', 'premium'].includes(status);
  }

  // If journey is premium and user is NOT, redirect to subscribe
  if (journey.isPremium && !isPremiumUser) {
    redirect('/subscribe');
  }

  // 3. Prepare hero image
  const heroImageUrl = journey.mainImage
    ? urlFor(journey.mainImage).width(1920).height(1080).fit('crop').url()
    : null;

  return (
    <main className={styles.container}>
      {/* HERO SECTION */}
      <header className={styles.hero}>
        {heroImageUrl && (
          <div className={styles.heroImageWrapper}>
             <Image 
               src={heroImageUrl} 
               alt={journey.title} 
               fill 
               className={styles.heroImage}
               priority
             />
             <div className={styles.heroOverlay} />
          </div>
        )}
        <div className={styles.heroContent}>
          <span className={styles.badge}>{journey.intensity} • {journey.durationDays} Days</span>
          <h1 className={styles.title}>{journey.title}</h1>
          {journey.description && <p className={styles.description}>{journey.description}</p>}
        </div>
      </header>

      {/* PRACTICE LIST SECTION */}
      <section className={styles.listSection}>
        <h2 className={styles.listTitle}>Your Schedule</h2>
        <div className={styles.practiceList}>
          {journey.practices?.map((practice, index) => {
             // Check if an individual video is locked (if user wasn't already forced to subscribe by journey lock)
             const isLocked = practice.isPremium && !isPremiumUser;
             
             return (
              <Link 
                key={practice._id} 
                href={isLocked ? '/subscribe' : `/practice/${practice.slug}`}
                className={`${styles.practiceItem} ${isLocked ? styles.locked : ''}`}
              >
                <div className={styles.practiceIndex}>{index + 1}</div>
                <div className={styles.practiceInfo}>
                  <h3 className={styles.practiceTitle}>{practice.title}</h3>
                  <span className={styles.practiceDuration}>
                     {Math.round(practice.duration / 60)} mins
                  </span>
                </div>
                <div className={styles.practiceAction}>
                  {isLocked ? <GoLock /> : <GoPlay />}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}