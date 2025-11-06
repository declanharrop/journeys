// journeys/app/src/app/api/webhooks/stripe/route.js

import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Helper function to find a user in Sanity by their Stripe Customer ID.
 */
const findUserByStripeId = async (customerId) => {
  const query = groq`*[_type == "user" && stripeCustomerId == $customerId][0]{ _id }`;
  const user = await serverClient.fetch(query, { customerId });
  return user?._id;
};

/**
 * Helper function to update the user's subscription details in Sanity.
 */
const updateSanitySubscription = async (customerId, status, periodEnd) => {
  // Find the Sanity user document ID using the Stripe ID
  const userId = await findUserByStripeId(customerId);
  
  if (!userId) {
    throw new Error(`[Webhook] User not found for Stripe customer: ${customerId}`);
  }

  // Convert the Unix timestamp (in seconds) from Stripe to an ISO string
  const periodEndDate = new Date(periodEnd * 1000).toISOString();

  // Patch the user document
  await serverClient
    .patch(userId)
    .set({
      subscriptionStatus: status,
      currentPeriodEnd: periodEndDate,
    })
    .commit();
  
  console.log(`[Webhook] Updated Sanity user ${userId} to ${status}`);
};

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;

  try {
    // 1. Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.warn(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 2. Handle the event
  try {
    switch (event.type) {
      // Fired when a 7-day trial starts
      case 'checkout.session.completed': {
        const session = event.data.object;
        // We need to get the full subscription object
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        await updateSanitySubscription(
          subscription.customer,
          subscription.status, // This will be 'trialing'
          subscription.current_period_end // This will be 7 days from now
        );
        break;
      }

      // Fired for renewals, cancellations, and when a trial ends
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await updateSanitySubscription(
          subscription.customer,
          subscription.status, // e.g., 'active' or 'canceled'
          subscription.current_period_end
        );
        break;
      }

      // Fired when the subscription is fully deleted
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await updateSanitySubscription(
          subscription.customer,
          subscription.status, // e.g., 'canceled'
          subscription.current_period_end
        );
        break;
      }
    }
  } catch (error) {
    console.error(`[Webhook] Error handling event ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  // 3. Respond to Stripe
  return NextResponse.json({ received: true });
}