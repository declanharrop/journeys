import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Define which routes need protection
const protectedRoutes = ["/home", "/account", "/journeys", "/practice"]

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isProtected = protectedRoutes.some(route => nextUrl.pathname.startsWith(route))
  const isOnboarding = nextUrl.pathname === "/onboarding"
  const isRoot = nextUrl.pathname === "/"

  // --- CASE 1: Not Logged In ---
  if (!isLoggedIn) {
    if (isProtected || isOnboarding) {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
    return // Allow access to public routes like "/"
  }

  // --- CASE 2: Logged In (Check Onboarding) ---
  if (isLoggedIn) {
    // Lightweight fetch for onboarding status
    const email = req.auth.user.email
    let isComplete = false
    try {
       const { NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_READ_TOKEN } = process.env
       const query = encodeURIComponent(`*[_type == "user" && email == "${email}"][0].onboardingComplete`)
       const url = `https://${NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${NEXT_PUBLIC_SANITY_DATASET}?query=${query}`
       
       const res = await fetch(url, {
         headers: SANITY_API_READ_TOKEN ? { Authorization: `Bearer ${SANITY_API_READ_TOKEN}` } : {},
         next: { revalidate: 0 }
       })
       const data = await res.json()
       isComplete = data?.result === true
    } catch (e) {
       console.error("Auth check failed:", e)
       isComplete = false // Default to safe state
    }

    // Redirect logic
    if (!isComplete && !isOnboarding) {
       return NextResponse.redirect(new URL("/onboarding", nextUrl))
    }
    if (isComplete && (isOnboarding || isRoot)) {
       return NextResponse.redirect(new URL("/home", nextUrl))
    }
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}