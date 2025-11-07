// journeys/app/src/lib/sanity.queries.js
import { groq } from 'next-sanity';

export const GET_USER_BY_EMAIL_QUERY = groq`
  *[_type == "user" && email == $email][0] {
    _id,
    name,
    email,
    stripeCustomerId,
    subscriptionStatus,
    currentPeriodEnd
  }
`;

export const GET_USER_BY_STRIPE_ID_QUERY = groq`
  *[_type == "user" && stripeCustomerId == $stripeId][0] {
    _id,
    name,
    email,
    subscriptionStatus
  }
`;