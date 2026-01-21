import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      const isOnAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/access-denied") ||
        pathname.startsWith("/forbidden")

      // Allow access to auth pages regardless of login status
      if (isOnAuthPage) {
        // Redirect logged-in users away from login page
        if (isLoggedIn && pathname === "/login") {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // Require login for all other pages
      if (!isLoggedIn) {
        return false // Redirects to signIn page
      }

      // Role-based route protection: Admin routes require ADMIN role
      if (pathname.startsWith("/admin")) {
        const userRole = auth?.user?.role
        console.log("[AUTH CONFIG] Admin check - auth.user:", JSON.stringify(auth?.user))
        if (userRole !== "ADMIN") {
          console.log(
            `[AUTH] Admin access denied: ${auth?.user?.email} (${userRole}) -> ${pathname}`
          )
          return Response.redirect(new URL("/forbidden", nextUrl))
        }
      }

      return true
    },
  },
  providers: [], // Providers configured in main auth.ts
} satisfies NextAuthConfig
