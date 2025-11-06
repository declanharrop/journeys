
import Auth0Provider from 'next-auth/providers/auth0';
import { serverClient } from './sanity.server'; 
import { groq } from 'next-sanity';

export const authOptions = {
    // THIS IS THE MOST IMPORTANT LINE
    // It tells getServerSession how to decrypt the cookie
    secret: process.env.NEXTAUTH_SECRET,

    providers: [
        Auth0Provider({
            clientId: process.env.AUTH0_CLIENT_ID,
            clientSecret: process.env.AUTH0_CLIENT_SECRET,
            issuer: `https:${process.env.AUTH0_DOMAIN}`,
            authorization: {
                params: {
                    prompt: 'login',
                },
            },
        }),
    ],
    
    callbacks: {
        // Correct: Creates user in Sanity
        async signIn({ user, account, profile }) {
            if (account.provider === 'auth0') {
                const auth0Id = user.id; 
                const sanityUser = await serverClient.fetch(
                    groq`*[_type == "user" && auth0Id == $auth0Id][0]`,
                    { auth0Id }
                );

                if (!sanityUser) {
                    const newUserDoc = {
                        _type: 'user',
                        auth0Id: auth0Id,
                        name: user.name || profile.nickname,
                        email: user.email,
                    };
                    await serverClient.create(newUserDoc);
                }
            }
            return true;
        },
        
        // Correct: Passes auth0Id ONLY
        async jwt({ token, user }) {
            if (user) {
                token.auth0Id = user.id; 
            }
            return token;
        },

        // Correct: Passes auth0Id ONLY
        async session({ session, token }) {
            session.user.auth0Id = token.auth0Id;
            return session;
        }
    }
};