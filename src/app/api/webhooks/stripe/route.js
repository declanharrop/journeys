// journeys/app/src/app/api/webhooks/stripe/route.js

import { NextResponse } from 'next/server';
import { sanityWriteClient } from '@/lib/sanity.server';
import { GET_USER_BY_STRIPE_ID_QUERY } from '@/lib/sanity.queries';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function toISOString(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
}

export async function POST(req) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const { type, data } = event;
  let statusToSet = '';
  let stripeId = '';
  let periodEndTimestamp = null;
  let cancelAtPeriodEnd = false;

  try {
    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object;
        if (session.mode === 'subscription' && session.customer) {
          stripeId = session.customer;
          const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subId);
          
          statusToSet = subscription.status;
          periodEndTimestamp = subscription.current_period_end;
          // Robust check for cancellation status
          cancelAtPeriodEnd = subscription.cancel_at_period_end || (subscription.cancel_at !== null);
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
         const invoice = data.object;
         if (invoice.subscription && invoice.customer) {
           stripeId = invoice.customer;
           const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
           statusToSet = subscription.status;
           periodEndTimestamp = subscription.current_period_end;
           cancelAtPeriodEnd = subscription.cancel_at_period_end || (subscription.cancel_at !== null);
         }
         break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = data.object;
        stripeId = subscription.customer;
        statusToSet = subscription.status;
        periodEndTimestamp = subscription.current_period_end;
        // Robust check for cancellation status
        cancelAtPeriodEnd = subscription.cancel_at_period_end || (subscription.cancel_at !== null);
        break;
      }
      
      default:
        return NextResponse.json({ received: true });
    }

    if (!statusToSet || !stripeId) {
      return NextResponse.json({ received: true });
    }

    const user = await sanityWriteClient.fetch(GET_USER_BY_STRIPE_ID_QUERY, { stripeId });

    if (user) {
      await sanityWriteClient
        .patch(user._id)
        .set({
          subscriptionStatus: statusToSet,
          cancelAtPeriodEnd: cancelAtPeriodEnd, // Will now be true if cancel_at is set
          ...(periodEndTimestamp && { currentPeriodEnd: toISOString(periodEndTimestamp) }),
        })
        .commit();
      console.log(`User ${user.email} updated: Status=${statusToSet}, Canceling=${cancelAtPeriodEnd}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}