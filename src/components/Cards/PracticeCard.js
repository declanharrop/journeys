import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/components/PracticeCard.module.css';
import { urlFor } from '@/lib/sanity.client';

export default function PracticeCard({ practice }) {
  if (!practice) {
    return null;
  }

  const { title, slug, thumbnail } = practice; 

  let thumbnailUrl = null;

  // 1. --- THIS IS THE FIX ---
  if (thumbnail) {
    thumbnailUrl = urlFor(thumbnail)
      .width(1200)
      .auto('format')
      .quality('80')
      .url();
  } else {
    thumbnailUrl = '/placeholder-image.jpg'; 
  }
  // 👆 --- END OF FIX --- 👆

  return (
    <Link href={`/practice/${slug}`} className={styles.cardLink}>
      <div className={styles.imageContainer}>
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
      </div>
    </Link>
  );
}