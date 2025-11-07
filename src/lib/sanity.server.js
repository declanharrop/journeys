// journeys/app/src/lib/sanity.server.js
import { createClient } from 'next-sanity';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = '2024-10-01'; 
const sanityToken = process.env.SANITY_API_WRITE_TOKEN;

// 1. --- READ-ONLY CLIENT (for protected server-side fetches, middleware) ---
export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

// 2. --- WRITE-ENABLED CLIENT (for mutations, sign-in, webhooks) ---
// This client uses the SANITY_API_WRITE_TOKEN.
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: sanityToken,
});