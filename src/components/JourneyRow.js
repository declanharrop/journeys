import JourneyCard from '@/components/Cards/JourneyCard';
import styles from '@/styles/components/JourneyRow.module.css';

// Accept new prop: isPremiumUser
export default function JourneyRow({ title, journeys, isPremiumUser = false }) {
  if (!journeys || journeys.length === 0) return null;

  return (
    <section className={styles.rowContainer}>
      <h2 className={styles.rowTitle}>{title}</h2>
      <div className={styles.rowScroller}>
        {journeys.map((journey) => {
           // 👇 Calculate lock state based on user status
           const isLocked = journey.isPremium && !isPremiumUser;
           
           return (
            <div key={journey._id} className={styles.cardWrapper}>
               <JourneyCard 
                  journey={journey}
                  isLocked={isLocked} 
               />
            </div>
          );
        })}
      </div>
    </section>
  );
}