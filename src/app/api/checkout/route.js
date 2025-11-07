// journeys/app/src/app/api/checkout/route.js

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // NextAuth v5 helper
import { serverClient, sanityWriteClient } from '@/lib/sanity.server'; // Import BOTH clients
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// This is your server-side "source of truth" for prices.
const PLAN_CONFIG = {
  'price_1SQScqIlcUDYS9QKfEdD30Ym': {
    trialDays: 5,
  },
  'price_1SQSdBIlcUDYS9QKU23n5Too': {
    trialDays: 0,
  },
  'price_1SQSdoIlcUDYS9QKBY2iNDfB': {
    trialDays: 0,
  },
};

// Centralized query to fetch user data needed for checkout
const GET_USER_FOR_CHECKOUT_QUERY = groq`*[_type == "user" && email == $email][0]{
  _id,
  email,
  stripeCustomerId
}`;

export async function POST(request) {
  try {
    // 1. Get the user's session using the new v5 auth helper
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get the price ID from the request body
    const { priceId } = await request.json();
    
    // 3. Look up the plan details from secure config
    const plan = PLAN_CONFIG[priceId];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid Price ID' }, { status: 400 });
    }
    
    const trialPeriodDays = plan.trialDays || 0;
    
    // 4. Fetch the Sanity user by EMAIL (read-only is fine here for speed)
    const user = await serverClient.fetch(
      GET_USER_FOR_CHECKOUT_QUERY,
      { email },
      { cache: 'no-store' }
    );

    if (!user) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // 5. If they don't have a Stripe ID, create one and save it to Sanity
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          sanityId: user._id, // Link to Sanity _id for reference
        },
      });
      stripeCustomerId = customer.id;

      // 👇 VITAL CHANGE: Use sanityWriteClient for the patch
      await sanityWriteClient
        .patch(user._id)
        .set({ stripeCustomerId: stripeCustomerId })
        .commit();
    }
    
    // 6. Determine base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 7. Create the Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      ...(trialPeriodDays > 0 && {
        subscription_data: {
          trial_period_days: trialPeriodDays,
        }
      }),
      success_url: `${baseUrl}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe`,
      metadata: {
        sanityUserId: user._id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}