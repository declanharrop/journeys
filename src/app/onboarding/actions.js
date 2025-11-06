// journeys/app/src/app/onboarding/actions.js
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { serverClient } from '@/lib/sanity.server.js';
import { groq } from 'next-sanity';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding(formData) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.auth0Id) {
    return { error: 'Unauthorized' };
  }

  const auth0Id = session.user.auth0Id;
  const { name, monthOfBirth, yearOfBirth, goals } = formData;

  if (!name || !monthOfBirth || !yearOfBirth || !goals || goals.length === 0) {
    return { error: 'Missing required fields' };
  }

  try {
    // --- START CRITICAL BLOCK ---
    // 1. Find the user
    const sanityUser = await serverClient.fetch(
      groq`*[_type == "user" && auth0Id == $auth0Id][0]{ _id }`,
      { auth0Id }
    );

    if (!sanityUser || !sanityUser._id) {
      return { error: 'Sanity user not found' };
    }
    
    const userId = sanityUser._id;

    // 2. Patch the user (This is where Sanity gets updated)
    await serverClient
      .patch(userId)
      .set({ 
        name: name,
        monthOfBirth: parseInt(monthOfBirth, 10),
        yearOfBirth: parseInt(yearOfBirth, 10),
        goals: goals,
        onboardingComplete: true,
      })
      .commit();
    // --- END CRITICAL BLOCK ---

  } catch (error) {
    // If ANY of the above fails, return an error
    console.error('Onboarding Server Action Error:', error);
    return { error: error.message };
  }

  // --- POST-SUCCESS TASKS ---
  // If the 'try' block succeeded, we are here.
  
  // 3. Attempt to revalidate the cache.
  // We wrap this in its OWN try/catch so it can't
  // block the redirect if it fails.
  try {
    revalidatePath('/', 'layout');
  } catch (revalidateError) {
    console.warn('Cache revalidation failed (non-critical):', revalidateError);
  }

  // 4. Finally, redirect the user to the home page.
  // This is now guaranteed to run if the Sanity patch was successful.
  redirect('/home');
}