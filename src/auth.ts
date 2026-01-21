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
          id: profile.sub,
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
    async jwt({ token, user }) {
      // Add id to JWT when user signs in
      if (user) {
        token.id = user.id!
      }
      // Always fetch role from database to handle role changes
      // This ensures admin promotions take effect immediately
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        })
        token.role = dbUser?.role ?? "VIEWER"
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
