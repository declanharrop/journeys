import { NextResponse } from 'next/server';
// Use the new sanityWriteClient from our updated server file
import { sanityWriteClient } from '@/lib/sanity.server'; 
import { GET_USER_BY_STRIPE_ID_QUERY } from '@/lib/sanity.queries'; // Our new query helper
import { Stripe } from 'stripe';

// 1. Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper to convert Unix timestamp to ISO 8601 string
function toISOString(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

export async function POST(req) {
  console.log('--- WEBHOOK RECEIVED ---'); 

  // --- Signature Verification ---
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[Stripe Webhook] Error: Missing signature or secret');
    return NextResponse.json({ error: 'Missing Stripe signature or webhook secret' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret); 
    console.log(`[Stripe Webhook] Signature verified. Event type: ${event.type}`);
  } catch (err) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }
  // --- End Signature Verification ---

  const { type, data } = event;
  let statusToSet = '';
  let stripeId = '';
  let periodEndTimestamp = null;

  try {
    // --- Determine Action Based on Event Type ---
    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object;
        if (session.mode === 'subscription' && session.customer) {
          stripeId = session.customer;
          // We might need to fetch subscription if it's not fully expanded in session
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          
          statusToSet = (subscription.status === 'active' || subscription.status === 'trialing') ? 'active' : subscription.status;
          periodEndTimestamp = subscription.current_period_end;
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Good for renewals
        const invoice = data.object;
        if (invoice.subscription && invoice.customer) {
           stripeId = invoice.customer;
           const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
           statusToSet = 'active'; // Payment succeeded, so they are active
           periodEndTimestamp = subscription.current_period_end;
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': 
      case 'customer.subscription.deleted': { 
        const subscription = data.object;
        stripeId = subscription.customer;
        statusToSet = subscription.status; // Use exact status from Stripe (active, trialing, past_due, canceled, etc.)
        periodEndTimestamp = subscription.current_period_end; 
        break;
      }
      
      default:
        // console.log(`[Stripe Webhook] Event ignored: ${type}`);
        return NextResponse.json({ received: true });
    } // End Switch

    if (!statusToSet || !stripeId) {
       return NextResponse.json({ received: true, message: 'No actionable data found in event.' });
    }

    console.log(`[Stripe Webhook] Actionable Event: ${type}. User: ${stripeId}, Status: ${statusToSet}`);

    // --- Update Sanity Logic ---
    // Use sanityWriteClient to fetch the user to ensure we can write back to them
    const user = await sanityWriteClient.fetch(GET_USER_BY_STRIPE_ID_QUERY, { stripeId });

    if (!user) {
      console.warn(`[Stripe Webhook] User NOT FOUND in Sanity for Stripe ID: ${stripeId}. Race condition possible.`);
      // Return 200 to Stripe so it doesn't retry endlessly if the user truly doesn't exist yet.
      // The next event (like subscription.updated) usually catches it.
      return NextResponse.json({ received: true, message: 'User not found yet. Skipping.' }); 
    }

    const updateData = {
      subscriptionStatus: statusToSet,
      ...(periodEndTimestamp && { currentPeriodEnd: toISOString(periodEndTimestamp) }), 
    };

    await sanityWriteClient
      .patch(user._id)
      .set(updateData)
      .commit();

    console.log(`[Stripe Webhook] SUCCESS: User ${user.email} updated to ${statusToSet}.`);
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Stripe Webhook] Error handling webhook logic:', error);
    // Return 500 only for actual server errors so Stripe retries
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}