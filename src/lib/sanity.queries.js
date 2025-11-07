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
  cancelAtPeriodEnd, 
  currentPeriodEnd,
  stripeCustomerId
}`;

export const GET_STRIPE_ID_QUERY = groq`*[_type == "user" && email == $email][0].stripeCustomerId`;

export const JOURNEY_WITH_PROGRESS_QUERY = groq`{
  "journey": *[_type == "journey" && slug.current == $slug][0]{
    _id,
    title,
    "practices": practices[]->{
      _id,
      title,
      "slug": slug.current,
      thumbnail,
      durationMinutes
    }
  },
  // Fetch the specific progress entry for THIS journey for THIS user
  "userProgress": *[_type == "user" && email == $email][0].journeyProgress[journey._ref == ^.journey._id][0]{
     completedPractices[]->{_id}
  }
}`;

export const ALL_JOURNEYS_QUERY = groq`
  *[_type == "journey"] | order(_createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    description,
    coverImage, // Ensure you have your image builder set up to use this
    durationDays,
    intensity,
    focus,
    isPremium,
    "practiceCount": count(practices)
  }
`;

export const GET_JOURNEY_BY_SLUG_QUERY = groq`
  *[_type == "journey" && slug.current == $slug][0]{
    _id,
    title,
    description,
    mainImage,
    intensity,
    durationDays,
    isPremium,
    // Expand the ordered list of practices
    practices[]->{
      _id,
      title,
      "slug": slug.current,
      thumbnail,
      "duration": video.asset->data.duration,
      "playbackId": video.asset->playbackId,
      isPremium
    }
  }
`;

// 1. Fetch essential user data for filtering journeys
export const USER_JOURNEY_FILTER_DATA_QUERY = groq`*[_type == "user" && email == $email][0]{
  goals,
  "activeJourneyIds": journeyProgress[].journey._ref
}`;

// 2. Reusable Journey Projection (to keep queries clean)
const JOURNEY_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  mainImage,
  durationDays,
  intensity,
  isPremium,
  "practiceCount": count(practices)
}`;

// 3. The three specific row queries
export const ACTIVE_JOURNEYS_QUERY = groq`
  *[_type == "journey" && _id in $ids] | order(_updatedAt desc) ${JOURNEY_PROJECTION}
`;

export const GOAL_JOURNEYS_QUERY = groq`
  *[_type == "journey" && focus in $goals] | order(_createdAt desc) [0...10] ${JOURNEY_PROJECTION}
`;
