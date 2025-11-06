// journeys/app/src/lib/sanity.server.js

import { createClient } from '@sanity/client';
import { groq } from 'next-sanity';

// 1. --- READ CLIENT (Used for public fetches/queries) ---
const readConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-10-01',
  useCdn: true,
};

export const serverClient = createClient(readConfig);

// 2. --- WRITE CLIENT (Used for mutations, webhooks) ---
const writeConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-10-01',
  useCdn: false,
  // Must use the token with write permissions (Editor role)
  token: process.env.SANITY_API_WRITE_TOKEN, 
};

export const sanityWriteClient = createClient(writeConfig); // 👈 NEW EXPORT