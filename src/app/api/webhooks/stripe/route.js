import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const findUserByStripeId = async (customerId) => {
  // ... (this helper function is correct)
};

/**
 * Helper function to map Stripe's status to our simplified Sanity status.
 */
function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing': // 👈 THIS IS THE FIX
      return 'premium';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    default:
      return 'free'; // 'inactive', 'unpaid', etc.
  }
}

/**
 * Helper function to update the user's subscription details in Sanity.
 */
const updateSanitySubscription = async (customerId, stripeStatus, periodEnd) => {
  const userId = await findUserByStripeId(customerId);
  if (!userId) {
    throw new Error(`[Webhook] User not found for Stripe customer: ${customerId}`);
  }

  // 👇 --- THIS IS THE FIX --- 👇
  // Convert Stripe status ('trialing') to our app status ('premium')
  const sanityStatus = mapStripeStatus(stripeStatus);
  const periodEndDate = new Date(periodEnd * 1000).toISOString();
  // 👆 --- END OF FIX --- 👆

  await serverClient
    .patch(userId)
    .set({
      subscriptionStatus: sanityStatus, // Save the mapped status
      currentPeriodEnd: periodEndDate,
    })
    .commit();
  
  console.log(`[Webhook] Updated Sanity user ${userId} to ${sanityStatus}`);
};

export async function POST(request) {
  // ... (payload, signature, and event verification logic is correct)

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    // ...
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        await updateSanitySubscription(
          subscription.customer,
          subscription.status, // This will be 'trialing'
          subscription.current_period_end
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await updateSanitySubscription(
          subscription.customer,
          subscription.status, // e.g., 'active' or 'canceled'
          subscription.current_period_end
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await updateSanitySubscription(
          subscription.customer,
          subscription.status, // 'canceled'
          subscription.current_period_end
        );
        break;
      }
    }
  } catch (error) {
    // ...
  }

  return NextResponse.json({ received: true });
}