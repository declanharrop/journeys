// journeys/app/src/middleware.js

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { serverClient } from './lib/sanity.server'; // Use your correct path
import { groq } from 'next-sanity';

// 1. We must use the 'nodejs' runtime for the serverClient
export const runtime = 'nodejs';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 2. Get the session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // 3. --- THIS IS THE CHANGE ---
  //    We now identify the user by EMAIL
  const email = token?.email;
  const isAuthenticated = !!email;
  // 4. --- END OF CHANGE ---

  // --- DEFINE YOUR ROUTES ---
  const publicPaths = ['/']; // The landing page
  const onboardingPath = '/onboarding';
  const protectedAppPaths = ['/home', '/journeys', '/account', '/all-videos', '/subscribe'];

  // --- LOGIC: USER IS NOT LOGGED IN ---
  if (!isAuthenticated) {
    // If user is not logged in but tries to access a protected app path,
    // redirect them to the landing page.
    if (protectedAppPaths.includes(pathname) || pathname === onboardingPath) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    // Otherwise, (e.g., they are on the landing page) let them stay.
    return NextResponse.next();
  }

  // --- LOGIC: USER *IS* LOGGED IN ---
  
  // 5. --- THIS IS THE CHANGE ---
  //    Fetch their *live* data from Sanity using their EMAIL
  const userQuery = groq`*[_type == "user" && email == $email][0]{ 
    onboardingComplete, 
    subscriptionStatus 
  }`;
  const user = await serverClient.fetch(userQuery, { email });
  // 6. --- END OF CHANGE ---

  // Safety check: if user exists in Auth0 but not Sanity
  // (This is unlikely after our signIn callback, but good to have)
  if (!user) {
    console.error(`Middleware: User ${email} not found in Sanity. Redirecting to /`);
    // We could also redirect to a logout page here
    return NextResponse.redirect(new URL('/', req.url));
  }

  const { onboardingComplete } = user;

  // --- Handle redirect logic (this is all correct) ---
  
  // If Onboarding is false, force them to the /onboarding page
  if (!onboardingComplete) {
    if (pathname !== onboardingPath) {
      return NextResponse.redirect(new URL(onboardingPath, req.url));
    }
  }
  
  // If Onboarding is true, send them to /home
  if (onboardingComplete) {
    // If they are on the landing page or the onboarding page,
    // move them to the app's home.
    if (pathname === onboardingPath || publicPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }

  // If none of the above, let them continue to their requested page
  return NextResponse.next();
}

// Config: Tell the middleware which paths to run on
export const config = {
  matcher: [
    '/', // Landing page
    '/home',
    '/journeys',
    '/account',
    '/onboarding',
    '/all-videos',
    '/subscribe',
    '/practice/:path*', // Also protect all individual practice pages
  ],
};