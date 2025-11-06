import { createClient } from '@sanity/client';

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-10-01',
  useCdn: false, // Must be false for writes & fresh data
  
  // USE THE WRITE TOKEN. This client only runs on the server.
  token: process.env.SANITY_API_WRITE_TOKEN, 
};

export const serverClient = createClient(config);