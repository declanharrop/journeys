// journeys/app/src/app/components/Cards/JourneyCard.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/components/Cards/JourneyCard.module.css';
import { urlFor } from '@/lib/sanity.client'; // 👈 Import our image builder

export default function JourneyCard({ journey }) {
  if (!journey) return null;

  const { title, slug, mainImage, description } = journey;

  // Build the image URL
  const imageUrl = mainImage 
    ? urlFor(mainImage).width(600).height(400).fit('crop').url()
    : '/placeholder.jpg'; // A fallback image if one isn't set

  return (
    <Link href={`/journey/${slug}`} className={styles.cardLink}>
      <div className={styles.imageContainer}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          className={styles.image}
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </Link>
  );
}