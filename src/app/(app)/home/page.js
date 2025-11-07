import { auth } from '@/lib/auth';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import PracticeRow from '@/components/PracticeRow';
import styles from '@/styles/pages/home/homePage.module.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- QUERIES ---
const USER_DATA_QUERY = groq`*[_type == "user" && email == $email][0]{ name, goals }`;

const BASE_PRACTICE_QUERY = `
  *[_type == "practice" && defined(video.asset) FILTER_HERE] 
  | order(_createdAt desc) [0...10] {
    _id,
    title,
    thumbnail,
    "slug": slug.current,
    "duration": video.asset->data.duration,
    "playbackId": video.asset->playbackId,
    isPremium
  }
`;

const goalLabels = {
  peace: 'Finding Inner Peace',
  strength: 'Building Strength',
  flexibility: 'Increasing Flexibility',
  sleep: 'Improving Sleep',
  beginner: 'Beginner Basics',
};

export default async function HomePage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  // 1. Fetch User Goals
  const user = await serverClient.fetch(USER_DATA_QUERY, { email: userEmail });
  const uniqueGoals = [...new Set(user?.goals || [])];

  // 2. Create goal-based rows first
  const rowsToFetch = uniqueGoals.map((goal) => ({
    title: `For ${goalLabels[goal] || goal}`,
    filter: `&& "${goal}" in goals` 
  }));

  // 3. 👇 ALWAYS add "Latest Practices" row at the bottom
  rowsToFetch.push({
    title: 'Newest Practices',
    filter: '' // Empty filter means it fetches from ALL sectors
  });

  // 4. Fetch all rows in parallel
  const promises = rowsToFetch.map(({ filter }) => {
    const query = BASE_PRACTICE_QUERY.replace('FILTER_HERE', filter);
    return serverClient.fetch(groq`${query}`);
  });

  const results = await Promise.all(promises);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h2>Welcome home, {user?.name || 'Yogi'}</h2>
      </header>
      
      <div className={styles.feedGrid}>
        {rowsToFetch.map((row, index) => (
          <PracticeRow 
            key={row.title}
            title={row.title}
            practices={results[index]}
          />
        ))}
      </div>
    </main>
  );
}