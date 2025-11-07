'use server'; 

import { auth } from '@/lib/auth'; // The new, stable auth helper
import { sanityWriteClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity'; // Needed for the query
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding(formData) {
  
  const session = await auth(); // Get the current session
  const email = session?.user?.email;

  if (!email) {
    // If Auth is broken, return
    return { error: 'Unauthorized: Session failed.' };
  }

  // --- NEW LOGIC: Check for user existence and create if needed ---
  // We use the write client for an uncached read/write transaction
  const userQuery = groq`*[_type == "user" && email == $email][0]{ _id, onboardingComplete }`;
  const existingUser = await sanityWriteClient.fetch(userQuery, { email });

  let userId;

  if (!existingUser) {
    // This handles the user's first login immediately after Auth0 login.
    const newUser = await sanityWriteClient.create({
      _type: 'user',
      email: email,
      name: formData.name || session.user.name,
      onboardingComplete: true, // Mark complete on successful submission
      // Rest of the data below will be set via patch
    });
    userId = newUser._id;
  } else if (existingUser.onboardingComplete) {
     // User is already onboarded, something went wrong, redirect home.
     redirect('/home');
  } else {
    userId = existingUser._id;
  }
  // --- END NEW LOGIC ---

  // ... (Rest of the validation is correct)
  const { name, monthOfBirth, yearOfBirth, goals } = formData;
  if (!name || !monthOfBirth || !yearOfBirth || !goals || goals.length === 0) {
    return { error: 'Missing required fields' };
  }

  try {
    // Patch the user's document using the ID we found/created
    await sanityWriteClient
      .patch(userId) 
      .set({ 
        name: name,
        monthOfBirth: parseInt(monthOfBirth, 10),
        yearOfBirth: parseInt(yearOfBirth, 10),
        goals: goals,
        onboardingComplete: true, // Set to true here
      })
      .commit();

    revalidatePath('/', 'layout');
    
  } catch (error) {
    console.error('Onboarding Server Action Error:', error);
    return { error: 'Failed to save data to Sanity.' };
  }

  // Redirect on success
  redirect('/home');
}