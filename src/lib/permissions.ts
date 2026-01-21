import { UserRole } from "@prisma/client"

/**
 * Check if user role can edit content (ADMIN or EDITOR)
 */
export function canEdit(role: UserRole | undefined): boolean {
  if (!role) return false
  return role === UserRole.ADMIN || role === UserRole.EDITOR
}

/**
 * Check if user role is admin
 */
export function isAdmin(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN
}
