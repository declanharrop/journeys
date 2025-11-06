// journeys/app/src/app/api/auth/[...nextauth]/route.js

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions'; // 👈 Import central config

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };