import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to map Stripe status to our Sanity status
function mapStripeStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'premium';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    default:
      return 'free';
  }
}

// Helper to update Sanity
const updateSanitySubscription = async (sanityId, stripeStatus, periodEnd) => {
  if (!sanityId) {
    throw new Error(`[Webhook] Sanity ID not found.`);
  }
  const sanityStatus = mapStripeStatus(stripeStatus);
  const periodEndDate = new Date(periodEnd * 1000).toISOString();

  await serverClient
    .patch(sanityId)
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
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    let sanityId;
    let subscription;
    let customerId;

    // 1. Get the subscription object from the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      subscription = await stripe.subscriptions.retrieve(session.subscription);
      customerId = subscription.customer;
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      subscription = event.data.object;
      customerId = subscription.customer;
    } else {
      return NextResponse.json({ received: true }); // Not an event we handle
    }

    // 2. Try to get sanityId from metadata (the best way)
    const customer = await stripe.customers.retrieve(customerId);
    sanityId = customer.metadata.sanityId;

    // 3. 👇 --- THE FALLBACK FIX --- 👇
    // If metadata is missing (e.g., from an old customer), fall back to searching.
    if (!sanityId) {
      console.warn(`[Webhook] SanityId not found in metadata for customer ${customerId}. Falling back to search.`);
      
      // Wait 3 seconds to let the checkout API finish writing to Sanity
      await new Promise(resolve => setTimeout(resolve, 3000)); 
      
      const user = await serverClient.fetch(
          groq`*[_type == "user" && stripeCustomerId == $customerId][0]{ _id }`,
          { customerId: customerId }
      );
      sanityId = user?._id;
    }
    // 👆 --- END OF FIX --- 👆

    // 4. Update Sanity
    await updateSanitySubscription(
      sanityId,
      subscription.status,
      subscription.current_period_end
    );

  } catch (error) {
    console.error(`[Webhook] Error handling event ${event.type}:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  // Respond to Stripe
  return NextResponse.json({ received: true });
}