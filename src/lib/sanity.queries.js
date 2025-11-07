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

export const GET_USER_STATUS_BY_ID_QUERY = groq`*[_type == "user" && _id == $id][0].subscriptionStatus`;

// For FREE users
export const FREE_PRACTICES_QUERY = groq`
  *[_type == "practice" && 
    (isPremium == false || !defined(isPremium)) &&
    defined(video.asset)
  ] | order(_createdAt desc) [0...10] {
    _id,
    title,
    thumbnail,
    "slug": slug.current,
    "duration": video.asset->data.duration,
    "playbackId": video.asset->playbackId
  }
`;

// For PREMIUM users
export const PREMIUM_PRACTICES_QUERY = groq`
  *[_type == "practice" && 
    defined(video.asset)
  ] | order(_createdAt desc) [0...10] {
    _id,
    title,
    thumbnail,
    "slug": slug.current,
    "duration": video.asset->data.duration,
    "playbackId": video.asset->playbackId
  }
`;

export const GET_PRACTICE_BY_SLUG_QUERY = groq`
  *[_type == "practice" && slug.current == $slug][0] {
    _id,
    title,
    description,
    thumbnail,
    "playbackId": video.asset->playbackId,
    isPremium
  }
`;

export const GET_ACCOUNT_DETAILS_QUERY = groq`*[_type == "user" && email == $email][0]{
  _id,
  name,
  email,
  subscriptionStatus,
  currentPeriodEnd,
  stripeCustomerId
}`;