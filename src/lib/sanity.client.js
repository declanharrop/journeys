// journeys/app/src/lib/sanity.client.js

// src/lib/sanity.client.js
import { createClient } from 'next-sanity';
import createImageUrlBuilder from '@sanity/image-url';

// --- Configuration (All public variables) ---
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-05-15';

// --- Read-Only Client (Public, Cached, Client-Safe) ---
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true, // Use CDN for fast, cached reads
});

// --- Image URL Builder (Client-Safe) ---
export const urlFor = (source) => 
  createImageUrlBuilder({ projectId, dataset }).image(source);

// --- Fetch Function (Client-Safe, uses Read-Only Client) ---
export async function sanityFetch(query, params = {}) { 
  const tags = [];
  if (params.treeId) {
    tags.push(`tree-${params.treeId}`);
  }
  if (params.userId) {
    tags.push(`user-${params.userId}`);
  }

  return client.fetch(query, params, { 
    // --- THIS IS THE FIX ---
    
    // 1. Tell next-sanity to bypass its CDN for this request
    perspective: 'published',
    useCdn: false,
    
    // -----------------------

    // 2. Tell Next.js not to cache this fetch
    cache: 'no-store',

    // 3. Tell Next.js to revalidate (redundant with no-store, but safe)
    next: {
      revalidate: 0,
      tags: tags,
    }
  });
}