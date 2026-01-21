import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // This runs on Edge - used by middleware
      // For now, just check if user exists
      // More granular checks happen in auth.ts
      return true // Let middleware.ts handle redirection
    },
  },
  providers: [], // Providers configured in main auth.ts
} satisfies NextAuthConfig
