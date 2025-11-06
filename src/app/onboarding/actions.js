'use server'; // This is a Server Action

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions'; // Use our app's authOptions
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';


export async function completeOnboarding(formData) {
  
  // 1. Get the session using our central authOptions
  const session = await getServerSession(authOptions);

  // 2. Check for the EMAIL in the session
  if (!session?.user?.email) {
    // This is the "Unauthorized" error you are seeing
    return { error: 'Unauthorized' };
  }

  const email = session.user.email;
  
  // 3. Get the form data
  const { name, monthOfBirth, yearOfBirth, goals } = formData;

  if (!name || !monthOfBirth || !yearOfBirth || !goals || goals.length === 0) {
    return { error: 'Missing required fields' };
  }

  try {
    // 4. Find the user in Sanity by their EMAIL
    const user = await serverClient.fetch(
      groq`*[_type == "user" && email == $email][0]{ _id }`,
      { email }
    );

    if (!user) {
      return { error: 'User not found in Sanity' };
    }
    
    // 5. Patch the user's document
    await serverClient
      .patch(user._id)
      .set({ 
        name: name,
        monthOfBirth: parseInt(monthOfBirth, 10),
        yearOfBirth: parseInt(yearOfBirth, 10),
        goals: goals,
        onboardingComplete: true, // This is the most important part
      })
      .commit();

    // 6. Revalidate the cache so the middleware sees the change
    revalidatePath('/', 'layout');

  } catch (error) {
    console.error('Onboarding Server Action Error:', error);
    return { error: error.message };
  }

  // 7. Redirect to the home page on success
  redirect('/home');
}