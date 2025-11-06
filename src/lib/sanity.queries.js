// journeys/app/src/lib/sanity.queries.js

import { groq } from 'next-sanity';

// Query used by the webhook to find the user in Sanity
export const GET_USER_BY_STRIPE_ID_QUERY = groq`
  *[_type == "user" && stripeCustomerId == $stripeId][0] {
    _id,
    email,
  }
`;