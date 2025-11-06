// journeys/app/src/lib/authOptions.js

import Auth0Provider from 'next-auth/providers/auth0';
import { serverClient } from './sanity.server'; // Use your correct path
import { groq } from 'next-sanity';

export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        Auth0Provider({
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            issuer: `https://${process.env.AUTH0_DOMAIN}`,
            authorization: {
                params: {
                    prompt: 'login',
                },
            },
        }),
    ],
    
    callbacks: {
        /**
         * This callback is triggered when a user signs in.
         * We use it to find or create a user in Sanity based on their email.
         */
        async signIn({ user, account, profile }) {
            if (account.provider === 'auth0') {
                const { email, name, id: auth0Id } = user;

                if (!email) {
                  console.error('Auth0 user is missing email. Cannot sign in.');
                  return false; // Prevent sign-in if email is missing
                }

                // 1. Check if the user already exists in Sanity by EMAIL
                const sanityUser = await serverClient.fetch(
                    groq`*[_type == "user" && email == $email][0]`,
                    { email }
                );

                if (!sanityUser) {
                    // 2. If user DOES NOT exist, create a new one
                    const newUserDoc = {
                        _type: 'user',
                        email: email,
                        name: name,
                        auth0Id: auth0Id, // Still save this for reference
                        // Schemas defaults will handle other fields
                    };
                    await serverClient.create(newUserDoc);
                    console.log(`[Auth] New user created in Sanity: ${email}`);
                } else {
                    // 3. If user DOES exist, update their auth0Id
                    // This links an existing Sanity user to their auth provider
                    await serverClient
                        .patch(sanityUser._id)
                        .set({ auth0Id: auth0Id })
                        .commit();
                    console.log(`[Auth] Existing user found in Sanity: ${email}`);
                }
            }
            return true; // Allow the sign-in
        },
        
        /**
         * The JWT callback no longer needs to do anything special.
         * The token will automatically contain the email and name from Auth0.
         */
        async jwt({ token, user }) {
            return token;
        },

        /**
         * The session callback also doesn't need to do anything.
         * The session.user object will automatically have name & email.
         */
        async session({ session, token }) {
            return session;
        }
    }
};