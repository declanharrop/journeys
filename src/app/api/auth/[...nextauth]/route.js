// journeys/app/src/app/api/auth/[...nextauth]/route.js
import { handlers } from "@/lib/auth";

// This exports the GET and POST handlers for NextAuth (simple and stable)
export const { GET, POST } = handlers;