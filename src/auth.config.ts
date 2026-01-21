import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized() {
      // This runs on Edge - used by middleware
      // For now, allow all requests through to the page handlers
      // Route protection will be implemented in a later phase
      return true
    },
  },
  providers: [], // Providers configured in main auth.ts
} satisfies NextAuthConfig
