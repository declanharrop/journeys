// journeys/app/src/middleware.js

import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { serverClient } from '@/lib/sanity.server'; // Our secure server client
import { groq } from 'next-sanity';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. Get the session token
  // This securely reads the session cookie on the server
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const auth0Id = token?.auth0Id;
  const isAuthenticated = !!token;

  // --- DEFINE YOUR ROUTES ---
  const publicPaths = ['/']; // The landing page
  const onboardingPath = '/onboarding';
  const protectedAppPaths = ['/home', '/journeys', '/account', '/all-videos'];

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
  
  // 2. Fetch their *live* data from Sanity (Your SST)
  const userQuery = groq`*[_type == "user" && auth0Id == $auth0Id][0]{ onboardingComplete }`;
  const user = await serverClient.fetch(userQuery, { auth0Id });

  // Safety check: if user exists in Auth0 but not Sanity (should be impossible
  // after first login, but good to have)
  if (!user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const { onboardingComplete } = user;

  // 3. Handle your redirect logic
  
  // Point 3: If Onboarding is false, force them to the /onboarding page
  if (!onboardingComplete) {
    if (pathname !== onboardingPath) {
      return NextResponse.redirect(new URL(onboardingPath, req.url));
    }
  }
  
  // Point 2: If Onboarding is true, send them to /home
  if (onboardingComplete) {
    // If they are on the landing page or (somehow) the onboarding page,
    // move them to the app's home.
    if (pathname === onboardingPath || publicPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }

  // 4. If none of the above, let them continue to their requested page
  return NextResponse.next();
}

// Config: Tell the middleware which paths to run on
export const config = {
  matcher: [
    '/',
    '/home',
    '/journeys',
    '/account',
    '/onboarding',
    '/all-videos',
  ],
};