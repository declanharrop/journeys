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
    // Note: We use rawBody here
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
        if (session.mode === 'subscription' && session.customer && session.subscription) {
          stripeId = session.customer;
          const subscription = await stripe.subscriptions.retrieve(session.subscription); 
          
          if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')) {
            // Your logic: Treat 'trialing' as 'active' (premium access)
            statusToSet = 'premium'; 
            periodEndTimestamp = subscription.current_period_end; 
            console.log(`[Stripe Webhook] Processing ${type}. Status: ${statusToSet}`);
          } else {
             console.log(`[Stripe Webhook] Ignoring ${type} with status ${subscription?.status}`);
             return NextResponse.json({ received: true, message: `Ignored ${type} with status ${subscription?.status}` });
          }
        } else {
           console.log(`[Stripe Webhook] Ignoring ${type} - not a relevant checkout session.`);
           return NextResponse.json({ received: true, message: 'Event ignored (not a relevant checkout session)' });
        }
        break;
      } 

      case 'customer.subscription.created': { 
        const subscriptionCreated = data.object;
        stripeId = subscriptionCreated.customer;
        
        if (subscriptionCreated.status === 'active' || subscriptionCreated.status === 'trialing') {
          // Your logic: Treat 'trialing' as 'premium'
          statusToSet = 'premium'; 
          periodEndTimestamp = subscriptionCreated.current_period_end; // Should be available on creation
          console.log(`[Stripe Webhook] Processing ${type}. Status: ${statusToSet}.`);
        } else {
          console.log(`[Stripe Webhook] Ignoring ${type} with status: ${subscriptionCreated.status}`);
          return NextResponse.json({ received: true, message: `Ignored ${type} with status ${subscriptionCreated.status}` });
        }
        break;
      }

      case 'customer.subscription.updated': 
      case 'customer.subscription.deleted': { 
        const subscription = data.object;
        stripeId = subscription.customer;
        
        // Map Stripe's status to your simplified status (active/trialing -> premium, everything else is passed through)
        statusToSet = (subscription.status === 'active' || subscription.status === 'trialing') ? 'premium' : subscription.status;

        periodEndTimestamp = subscription.current_period_end; 
        console.log(`[Stripe Webhook] Processing ${type}. User: ${stripeId}, Status: ${statusToSet}, Period End: ${periodEndTimestamp}`);
        break;
      }
      
      default:
        console.log(`[Stripe Webhook] Event ignored: ${type}`);
        return NextResponse.json({ received: true, message: 'Event ignored' });
    } // End Switch

    // --- Update Sanity Logic ---
    if (!statusToSet || !stripeId) {
      console.warn('[Stripe Webhook] Event processed, but no status or Stripe ID was determined.');
      return NextResponse.json({ received: true, message: 'Event ignored, no actionable data.' });
    }

    console.log(`[Stripe Webhook] Searching for user in Sanity with Stripe ID: ${stripeId}`);
    // Use sanityWriteClient to fetch the user
    const user = await sanityWriteClient.fetch(GET_USER_BY_STRIPE_ID_QUERY, { stripeId });

    if (!user) {
      console.error(`[Stripe Webhook] FATAL ERROR: User not found in Sanity with Stripe ID: ${stripeId}. This happens if the webhook is faster than the checkout route.`);
      // 🚨 CRITICAL: The user is created in a separate step, so we need to wait for the race condition to resolve.
      // We will skip the update now, and wait for the 'customer.subscription.created' event to handle it.
      // Since we now handle 'customer.subscription.created', we can return received=true.
      return NextResponse.json({ received: true, message: 'User not yet fully created in Sanity.' }); 
    }

    const updateData = {
      subscriptionStatus: statusToSet,
      ...(periodEndTimestamp && { currentPeriodEnd: toISOString(periodEndTimestamp) }), 
    };

    console.log(`[Stripe Webhook] Updating user ${user.email} in Sanity with data:`, updateData);
    await sanityWriteClient
      .patch(user._id)
      .set(updateData)
      .commit();

    console.log(`[Stripe Webhook] SUCCESS: User ${user.email} updated.`);
    
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Stripe Webhook] Error handling webhook logic:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}