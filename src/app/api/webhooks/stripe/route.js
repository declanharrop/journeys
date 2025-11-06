import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/sanity.server';
import { groq } from 'next-sanity';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;

  try {
    // 1. Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 2. Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const customerId = session.customer;

      // 3. Update the user in Sanity
      await serverClient
        .patch(groq`*[_type == "user" && stripeCustomerId == $customerId][0]._id`, { customerId })
        .set({ subscriptionStatus: 'premium' })
        .commit();
      
      console.log(`Updated user ${customerId} to premium.`);
      break;
    }

    // You can add more events here later
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status === 'active' ? 'premium' : 'free';

      // 4. Update the user's status on renewal or cancellation
      await serverClient
        .patch(groq`*[_type == "user" && stripeCustomerId == $customerId][0]._id`, { customerId })
        .set({ subscriptionStatus: status })
        .commit();
      
      console.log(`Updated user ${customerId} status to ${status}.`);
      break;
    }
  }

  // 5. Respond to Stripe to let them know we got it
  return NextResponse.json({ received: true });
}