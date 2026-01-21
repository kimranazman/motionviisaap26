import { auth } from "@/auth"

export default auth

export const config = {
  // Protect all routes except auth pages and static assets
  matcher: [
    /*
     * Match all request paths except:
     * - /login, /access-denied, /forbidden (auth pages)
     * - /api/auth/* (auth API routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon)
     * - /images/* (public images)
     */
    "/((?!login|access-denied|forbidden|api/auth|_next/static|_next/image|favicon.ico|images).*)",
  ],
}
