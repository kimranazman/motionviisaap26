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
        // Don't override id - let PrismaAdapter generate CUID
        // profile.sub is stored in Account.providerAccountId for linking
        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "VIEWER", // Default role for all new users
        }
      },
    }),
  ],
  callbacks: {
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
      if (user) {
        token.id = user.id!
        // Fetch role from database on sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id! },
          select: { role: true },
        })
        token.role = dbUser?.role ?? "VIEWER"
        console.log("[AUTH JWT] Sign-in - fetched role:", token.role)
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
