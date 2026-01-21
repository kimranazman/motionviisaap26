import { auth } from "@/auth"
import { UserRole } from "@prisma/client"
import { Session } from "next-auth"
import { NextResponse } from "next/server"

/**
 * Returns a 401 Unauthorized JSON response
 */
export function unauthorizedResponse(
  message: string = "Authentication required"
): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized", message },
    { status: 401 }
  )
}

/**
 * Returns a 403 Forbidden JSON response
 */
export function forbiddenResponse(
  message: string = "You don't have permission to access this resource"
): NextResponse {
  return NextResponse.json(
    { error: "Forbidden", message },
    { status: 403 }
  )
}

// Discriminated union for type-safe auth result handling
type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse }

/**
 * Requires authentication for API routes
 * Returns session if authenticated, 401 response if not
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()

  if (!session) {
    console.log("[AUTH] Unauthorized API access attempt")
    return { session: null, error: unauthorizedResponse() }
  }

  return { session, error: null }
}

/**
 * Requires specific role(s) for API routes
 * Returns session if authorized, 401/403 response if not
 */
export async function requireRole(
  ...allowedRoles: UserRole[]
): Promise<AuthResult> {
  const session = await auth()

  if (!session) {
    console.log("[AUTH] Unauthorized API access attempt")
    return { session: null, error: unauthorizedResponse() }
  }

  const userRole = session.user.role
  if (!allowedRoles.includes(userRole)) {
    console.log(
      `[AUTH] Forbidden: ${session.user.email} (${userRole}) requires [${allowedRoles.join(", ")}]`
    )
    return { session: null, error: forbiddenResponse() }
  }

  return { session, error: null }
}

/**
 * Convenience wrapper - requires ADMIN role
 */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole(UserRole.ADMIN)
}

/**
 * Convenience wrapper - requires ADMIN or EDITOR role
 */
export async function requireEditor(): Promise<AuthResult> {
  return requireRole(UserRole.ADMIN, UserRole.EDITOR)
}
