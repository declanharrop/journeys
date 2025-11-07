import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity.client';
import { GoLock } from 'react-icons/go';
import styles from '@/styles/components/Cards/JourneyCard.module.css';

export default function JourneyCard({ journey, isLocked }) {
  // Safety check: ensure mainImage exists before trying to build a URL
  const imageUrl = journey?.mainImage
    ? urlFor(journey.mainImage).width(800).height(450).fit('crop').url()
    : null;

  return (
    <Link href={isLocked ? '/subscribe' : `/journeys/${journey.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={journey.title || 'Journey cover'}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          // Fallback if no image is uploaded in Sanity
          <div className={styles.placeholder} />
        )}
        
        {isLocked && (
          <div className={styles.lockOverlay}>
            <GoLock className={styles.lockIcon} />
          </div>
        )}
        {journey.intensity && (
           <span className={styles.badge}>{journey.intensity}</span>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{journey.title}</h3>
        <div className={styles.meta}>
          <span>{journey.durationDays || 0} Days</span>
          <span>•</span>
          <span>{journey.practiceCount || 0} Practices</span>
        </div>
      </div>
    </Link>
  );
}