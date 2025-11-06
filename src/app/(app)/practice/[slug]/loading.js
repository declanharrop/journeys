// journeys/app/src/app/(app)/practice/[slug]/loading.js
import styles from '@/styles/pages/practice/practicePage.module.css'; // Use your existing styles

// This is a simple placeholder that mimics your page layout
export default function PracticeLoading() {
  return (
    <main className={styles.container}>
      {/* Placeholder for the video player */}
      <div style={{
        width: '100%',
        aspectRatio: '16 / 9',
        backgroundColor: '#222'
      }}>
      </div>
      
      <div className={styles.content}>
        {/* Placeholder for the title */}
        <div style={{
          height: '2.8rem',
          width: '70%',
          backgroundColor: '#eee',
          borderRadius: '4px',
        }}>
        </div>
        {/* Placeholder for the description */}
        <div style={{
          height: '4.8rem',
          width: '100%',
          backgroundColor: '#eee',
          borderRadius: '4px',
          marginTop: '12px',
        }}>
        </div>
      </div>
    </main>
  );
}