// journeys/app/src/app/api/checkout/route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// This is your server-side "source of truth" for prices.
// Make sure these Price IDs are correct.
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

export async function POST(request) {
  try {
    // 1. --- THIS IS THE CHANGE ---
    //    Get the user's session and use EMAIL
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // 2. --- END OF CHANGE ---

    const { priceId } = await request.json(); // The ID of the plan the user clicked
    
    // Look up the plan details from our secure config
    const plan = PLAN_CONFIG[priceId];

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    const trialPeriodDays = plan.trialDays || 0;
    
    // 3. --- THIS IS THE CHANGE ---
    //    Fetch the Sanity user by EMAIL
    const user = await serverClient.fetch(
      groq`*[_type == "user" && email == $email][0]{
        _id,
        email,
        stripeCustomerId
      }`,
      { email },
      { cache: 'no-store' }
    );
    // 4. --- END OF CHANGE ---

    if (!user) {
      return NextResponse.json({ error: 'User not found in Sanity' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // If they don't have a Stripe ID, create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          sanityId: user._id, // Link to Sanity _id
        },
      });
      stripeCustomerId = customer.id;

      // Save the new Customer ID to their Sanity document
      await serverClient
        .patch(user._id)
        .set({ stripeCustomerId: stripeCustomerId })
        .commit();
    }
    
    // Create the Stripe Checkout Session
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
      subscription_data: trialPeriodDays > 0 ? {
        trial_period_days: trialPeriodDays,
      } : {},
      success_url: `${process.env.NEXTAUTH_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe`,
    });

    return NextResponse.json({ url: checkoutSession.url });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}