// journeys/app/src/app/api/manage-subscription/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Use our app's authOptions
import { serverClient } from '@/lib/sanity.server'; // Use our app's serverClient
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// This is the query to find the user's Stripe ID by their email
const GET_USER_QUERY = groq`*[_type == "user" && email == $email][0]{
  stripeCustomerId
}`;

export async function POST(request) {
  try {
    // 1. Get the user's session
    const session = await getServerSession(authOptions);
    const email = session?.user?.email; // Get the email from the session

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Find the user in Sanity by their EMAIL
    const sanUser = await serverClient.fetch(
      GET_USER_QUERY, 
      { email: email }
    );

    if (!sanUser || !sanUser.stripeCustomerId) {
      return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 });
    }

    // 3. Get the base URL from environment variables
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // 4. Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sanUser.stripeCustomerId,
      return_url: `${baseUrl}/account`, // The page to send them back to
    });

    // 5. Return the URL to the client
    return NextResponse.json({ url: portalSession.url });

  } catch (error) {
    console.error("Error creating manage subscription session:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}