import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Helper function to map Stripe's status to our simplified Sanity status.
 */
function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing': // Treat 'trialing' as 'premium'
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
 * We now pass the 'sanityId' directly, which we get from Stripe's metadata.
 */
const updateSanitySubscription = async (sanityId, stripeStatus, periodEnd) => {
  if (!sanityId) {
    throw new Error(`[Webhook] Sanity ID not found in Stripe customer metadata.`);
  }

  // Convert Stripe status ('trialing') to our app status ('premium')
  const sanityStatus = mapStripeStatus(stripeStatus);
  // Convert the Unix timestamp (in seconds) from Stripe to an ISO string
  const periodEndDate = new Date(periodEnd * 1000).toISOString();

  await serverClient
    .patch(sanityId) // Use the direct Sanity ID
    .set({
      subscriptionStatus: sanityStatus,
      currentPeriodEnd: periodEndDate,
    })
    .commit();
  
  console.log(`[Webhook] Updated Sanity user ${sanityId} to ${sanityStatus}`);
};

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.warn(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      
      // Fired when a 7-day trial starts
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // --- THIS IS THE FIX ---
        // 1. Retrieve the customer from Stripe
        const customer = await stripe.customers.retrieve(subscription.customer);
        // 2. Get the sanityId we stored in the metadata
        const sanityId = customer.metadata.sanityId; 
        // --- END OF FIX ---

        await updateSanitySubscription(
          sanityId, // Pass the direct Sanity ID
          subscription.status, // This will be 'trialing'
          subscription.current_period_end
        );
        break;
      }

      // Fired for renewals, cancellations, etc.
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // --- THIS IS THE FIX ---
        const customer = await stripe.customers.retrieve(subscription.customer);
        const sanityId = customer.metadata.sanityId;
        // --- END OF FIX ---

        await updateSanitySubscription(
          sanityId,
          subscription.status,
          subscription.current_period_end
        );
        break;
      }
    }
  } catch (error) {
    console.error(`[Webhook] Error handling event ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  // Respond to Stripe
  return NextResponse.json({ received: true });
}