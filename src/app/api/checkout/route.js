import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_CONFIG = {
  'price_1SQScqIlcUDYS9QKfEdD30Ym': {
    trialDays: 5,
  },
  'price_1SQSdBIlcUDYS9QKU23n5Too': {
    trialDays: 0, // No trial
  },
  'price_1SQSdoIlcUDYS9QKBY2iNDfB': {
    trialDays: 0, // No trial
  },
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json(); // e.g., 'price_1P...'

    const plan = PLAN_CONFIG[priceId];

    if (!plan) {
      // This stops a user from sending a fake priceId
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Get the trial days. Default to 0 if not specified.
    const trialPeriodDays = plan.trialDays || 0;
    
    const auth0Id = session.user.auth0Id;
    
    // 1. Get the user's Sanity document
    const user = await serverClient.fetch(
      groq`*[_type == "user" && auth0Id == $auth0Id][0]{
        _id,
        email,
        stripeCustomerId
      }`,
      { auth0Id },
      { cache: 'no-store' }
    );

    let stripeCustomerId = user.stripeCustomerId;

    // 2. If they don't have a Stripe ID, create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          auth0Id: auth0Id, // Link Stripe customer to Auth0 ID
          sanityId: user._id, // Link to Sanity _id
        },
      });
      stripeCustomerId = customer.id;

      // 3. Save the new Customer ID to their Sanity document
      await serverClient
        .patch(user._id)
        .set({ stripeCustomerId: stripeCustomerId })
        .commit();
    }

    // 4. Create the Stripe Checkout Session
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