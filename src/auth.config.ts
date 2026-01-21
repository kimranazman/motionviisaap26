import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/access-denied")

      // Allow access to auth pages regardless of login status
      if (isOnAuthPage) {
        // Redirect logged-in users away from login page
        if (isLoggedIn && nextUrl.pathname === "/login") {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // Require login for all other pages
      if (!isLoggedIn) {
        return false // Redirects to signIn page
      }

      return true
    },
  },
  providers: [], // Providers configured in main auth.ts
} satisfies NextAuthConfig
