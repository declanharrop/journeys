// journeys/app/src/lib/sanity.client.js
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url'; // 👈 1. Import the builder

const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-10-01',
  useCdn: true,
};

// 2. Create the client
export const sanityClient = createClient(config);

// 3. Create and export the image builder
export const urlFor = (source) => imageUrlBuilder(sanityClient).image(source);