// journeys/app/src/lib/auth.js
import NextAuth from 'next-auth';
import Auth0 from 'next-auth/providers/auth0';

// Import our Sanity clients and the query
import { sanityWriteClient } from './sanity.server'; 
import { GET_USER_BY_EMAIL_QUERY } from './sanity.queries';

export const authOptions = {
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
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        const sanUser = await sanityWriteClient.fetch(GET_USER_BY_EMAIL_QUERY, {
          email: user.email,
        });

        if (sanUser) {
          token.id = sanUser._id;
          token.subscriptionStatus = sanUser.subscriptionStatus;
        } else {
          console.log(`New user signed up: ${user.email}. Creating Sanity document...`);
          const newUser = await sanityWriteClient.create({
            _type: 'user',
            name: user.name,
            email: user.email,
            subscriptionStatus: 'free',
          });
          token.id = newUser._id;
          token.subscriptionStatus = newUser.subscriptionStatus;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
        session.user.subscriptionStatus = token.subscriptionStatus;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};

// Initialize NextAuth with options
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);