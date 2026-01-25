import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", // Edge middleware compatible
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          hd: "talenta.com.my", // UI hint only - NOT security control
        },
      },
      profile(profile) {
        return {
          id: profile.sub, // Required by Auth.js for account linking
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "VIEWER", // Default role for all new users
        }
      },
    }),
  ],
  callbacks: {
    // Preserve the authorized callback from authConfig for middleware protection
    authorized: authConfig.callbacks.authorized,
    async signIn({ account, profile }) {
      // CRITICAL: Server-side domain validation
      // hd parameter alone is NOT sufficient (Pitfall #2)
      if (account?.provider === "google") {
        return (
          profile?.email_verified === true &&
          (profile?.email?.endsWith("@talenta.com.my") ?? false)
        )
      }
      return false // Reject non-Google providers
    },
    async jwt({ token, user, trigger }) {
      // Only fetch role on sign-in or explicit update (Node.js runtime)
      // Don't fetch on every request - Edge runtime doesn't support Prisma
      if (user && user.email) {
        // Look up database user by email to get the correct CUID
        // (user.id from profile callback is Google sub, not database ID)
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true },
        })
        if (dbUser) {
          token.id = dbUser.id // Use database CUID, not Google sub
          token.role = dbUser.role
          console.log("[AUTH JWT] Sign-in - user:", dbUser.id, "role:", dbUser.role)
        } else {
          // Fallback for edge case where user doesn't exist yet
          token.id = user.id!
          token.role = "VIEWER"
          console.log("[AUTH JWT] Sign-in - new user, fallback ID")
        }
      }
      // Handle session update trigger (e.g., after role change)
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        token.role = dbUser?.role ?? token.role
        console.log("[AUTH JWT] Update trigger - refreshed role:", token.role)
      }
      return token
    },
    async session({ session, token }) {
      // Add role and id to session from JWT
      if (session.user && token.id) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
})
