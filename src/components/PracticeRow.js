// src/components/PracticeRow.js
import PracticeCard from '@/components/Cards/PracticeCard';
import styles from '@/styles/components/PracticeRow.module.css';

export default function PracticeRow({ title, practices }) {
  // Don't render the row if there are no practices
  if (!practices || practices.length === 0) return null;

  return (
    <section className={styles.rowContainer}>
      <h2 className={styles.rowTitle}>{title}</h2>
      <div className={styles.rowScroller}>
        {practices.map((practice) => (
          <div key={practice._id} className={styles.cardWrapper}>
             <PracticeCard practice={practice} />
          </div>
        ))}
      </div>
    </section>
  );
}