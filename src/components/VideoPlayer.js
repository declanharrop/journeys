// journeys/app/src/app/components/VideoPlayer.js
'use client';

import MuxPlayer from '@mux/mux-player-react';
import styles from '@/styles/components/VideoPlayer.module.css';

// This is now a simple "dumb" component.
// It just receives the playbackId and plays it.
export default function VideoPlayer({ playbackId, thumbnailUrl }) {
  if (!playbackId) {
    return (
      <div className={styles.playerContainer}>
        <p style={{ color: 'white', padding: '20px' }}>Video not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.playerContainer}>
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        style={{ width: '100%', height: '100%' }}
        poster={thumbnailUrl}
        
      />
    </div>
  );
}