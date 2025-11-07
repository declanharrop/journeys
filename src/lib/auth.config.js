// src/lib/auth.config.js
import Auth0 from 'next-auth/providers/auth0';

export const authConfig = {
  providers: [
    Auth0({
      clientId: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      issuer: `https://${process.env.AUTH0_DOMAIN}`,
      authorization: {
        params: { prompt: 'login' },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    // This callback is CALLED by the middleware.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/home') || 
                            nextUrl.pathname.startsWith('/account') ||
                            nextUrl.pathname.startsWith('/journeys') ||
                            nextUrl.pathname.startsWith('/practice');
      const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');
      const isRoot = nextUrl.pathname === '/';

      // 1. PROTECT ROUTES: If trying to access dashboard but not logged in, redirect to landing (false).
      if (isOnDashboard && !isLoggedIn) return false;

      // 2. REDIRECT LOGGED IN USERS from root to home.
      // Actual onboarding check happens in middleware.js because it's async.
      if (isRoot && isLoggedIn) {
        return Response.redirect(new URL('/home', nextUrl));
      }

      // 3. Allow access to all other routes (like landing page when not logged in)
      return true;
    },
  },
};