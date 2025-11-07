// journeys/app/src/app/api/manage-subscription/route.js

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // 👈 Updated to NextAuth v5 helper
import { serverClient } from '@/lib/sanity.server';
import { GET_STRIPE_ID_QUERY } from '@/lib/sanity.queries'; // 👈 Centralized query
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // 1. Get the user's session using new v5 helper
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch just the Stripe ID from Sanity using centralized query
    // We use serverClient (read-only) as we are just fetching data.
    const stripeCustomerId = await serverClient.fetch(
      GET_STRIPE_ID_QUERY, 
      { email },
      { cache: 'no-store' }
    );

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found to manage.' }, { status: 404 });
    }

    // 3. Determine base URL for redirect
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 4. Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${baseUrl}/account`, // Where to send them back after managing
    });

    // 5. Return the URL to the client
    return NextResponse.json({ url: portalSession.url });

  } catch (error) {
    console.error("Error creating manage subscription session:", error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}